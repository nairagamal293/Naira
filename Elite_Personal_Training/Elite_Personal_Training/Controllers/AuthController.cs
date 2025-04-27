using Elite_Personal_Training.Models;
using Elite_Personal_Training.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using SendGrid;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Net;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace Elite_Personal_Training.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly SignInManager<User> _signInManager;
        private readonly IConfiguration _configuration;
        private readonly IEmailService _emailService;
        private readonly ILogger<AuthController> _logger;
        private readonly IWebHostEnvironment _environment;

        public AuthController(
            UserManager<User> userManager,
            SignInManager<User> signInManager,
            IConfiguration configuration,
            IEmailService emailService,
            ILogger<AuthController> logger,
            IWebHostEnvironment environment)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _configuration = configuration;
            _emailService = emailService;
            _logger = logger;
            _environment = environment;
        }

        [HttpPost("signup")]
        public async Task<IActionResult> SignUp([FromBody] SignUpRequest request)
        {
            if (request == null)
                return BadRequest(new { message = "Request body is empty." });

            if (string.IsNullOrWhiteSpace(request.FullName))
                return BadRequest(new { message = "Full Name is required." });

            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
                return BadRequest(new { message = "Email and Password are required." });

            var existingUser = await _userManager.FindByEmailAsync(request.Email);
            if (existingUser != null)
                return BadRequest(new { message = "User already exists with this email." });

            var user = new User
            {
                UserName = request.Email,
                Email = request.Email,
                FullName = request.FullName
            };

            var result = await _userManager.CreateAsync(user, request.Password);

            if (!result.Succeeded)
                return BadRequest(new { message = "User creation failed.", errors = result.Errors });

            await _userManager.AddToRoleAsync(user, "Member");

            // Send welcome email
            try
            {
                await _emailService.SendWelcomeEmailAsync(user.Email, user.FullName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send welcome email to {Email}", user.Email);
            }

            return Ok(new { message = "User created successfully!" });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            try
            {
                if (request == null || string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
                    return BadRequest(new { message = "Email and password are required." });

                var user = await _userManager.FindByEmailAsync(request.Email);
                if (user == null)
                    return Unauthorized(new { message = "Invalid credentials." });

                var result = await _signInManager.PasswordSignInAsync(
                    user,
                    request.Password,
                    isPersistent: false,
                    lockoutOnFailure: false);

                if (!result.Succeeded)
                    return Unauthorized(new { message = "Invalid credentials." });

                var roles = await _userManager.GetRolesAsync(user);
                var role = roles.FirstOrDefault() ?? "User";
                var token = GenerateJwtToken(user, role);

                return Ok(new
                {
                    Token = token,
                    User = new
                    {
                        Id = user.Id,
                        FullName = user.FullName,
                        Email = user.Email,
                        Role = role,
                        Phone = user.PhoneNumber
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Login error for email {Email}", request.Email);
                return StatusCode(500, new { message = "An internal server error occurred." });
            }
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            if (string.IsNullOrEmpty(request.Email))
                return BadRequest("Email is required.");

            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null)
                return Ok();

            try
            {
                // Generate raw token
                var token = await _userManager.GeneratePasswordResetTokenAsync(user);
                _logger.LogInformation("Generated raw token: {Token}", token);

                // URL encode the token
                var encodedToken = WebUtility.UrlEncode(token);
                _logger.LogInformation("URL encoded token: {EncodedToken}", encodedToken);

                // URL decode to verify
                var decodedToken = WebUtility.UrlDecode(encodedToken);
                _logger.LogInformation("URL decoded token: {DecodedToken}", decodedToken);

                // Verify token before returning
                var isValid = await _userManager.VerifyUserTokenAsync(
                    user,
                    _userManager.Options.Tokens.PasswordResetTokenProvider,
                    "ResetPassword",
                    token);

                _logger.LogInformation("Token verification result: {IsValid}", isValid);

                var resetLink = $"{_configuration["ClientUrl"]}/reset-password?token={encodedToken}&email={user.Email}";

                return Ok(new
                {
                    Message = "Development details",
                    RawToken = token,
                    EncodedToken = encodedToken,
                    DecodedToken = decodedToken,
                    IsValid = isValid,
                    ResetLink = resetLink
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Token generation error");
                return StatusCode(500, new { ex.Message });
            }
        }


        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            if (string.IsNullOrEmpty(request.Email) ||
                string.IsNullOrEmpty(request.Token) ||
                string.IsNullOrEmpty(request.NewPassword))
            {
                return BadRequest("All fields are required.");
            }

            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null)
                return BadRequest("Invalid request.");

            try
            {
                // Log the incoming token
                _logger.LogInformation("Received token: {Token}", request.Token);

                // Try both decoded and raw token
                var result = await _userManager.ResetPasswordAsync(user, request.Token, request.NewPassword);

                if (!result.Succeeded)
                {
                    _logger.LogError("Password reset failed. Errors: {Errors}",
                        string.Join(", ", result.Errors.Select(e => e.Description)));
                    return BadRequest(result.Errors);
                }

                return Ok("Password reset successfully!");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Password reset error");
                return StatusCode(500, new { ex.Message });
            }
        }


        [HttpPost("test-sendgrid")]
        public async Task<IActionResult> TestSendGridConnection()
        {
            try
            {
                var apiKey = _configuration["SendGrid:ApiKey"];
                if (string.IsNullOrEmpty(apiKey))
                {
                    return BadRequest("SendGrid API key is not configured");
                }

                var client = new SendGridClient(apiKey);
                var response = await client.RequestAsync(
                    method: SendGridClient.Method.GET,
                    urlPath: "scopes");

                if (!response.IsSuccessStatusCode)
                {
                    var body = await response.Body.ReadAsStringAsync();
                    return StatusCode((int)response.StatusCode, new
                    {
                        Status = response.StatusCode,
                        Body = body
                    });
                }

                return Ok("SendGrid connection successful");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "SendGrid connection test failed");
                return StatusCode(500, new
                {
                    Message = "SendGrid connection test failed",
                    Error = ex.Message
                });
            }
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            await _signInManager.SignOutAsync();
            return Ok(new { message = "Logged out successfully" });
        }

        private string GenerateJwtToken(User user, string role)
        {
            var securityKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Name, user.FullName),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.Role, role)
            };

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(12),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }

    public class SignUpRequest
    {
        public string FullName { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
    }

    public class LoginRequest
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }

    public class ForgotPasswordRequest
    {
        public string Email { get; set; }
    }

    public class ResetPasswordRequest
    {
        public string Email { get; set; }
        public string Token { get; set; }
        public string NewPassword { get; set; }
    }
}