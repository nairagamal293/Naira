using Elite_Personal_Training.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Security.Claims;
using System.Text;

namespace Elite_Personal_Training.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly SignInManager<User> _signInManager;
        private readonly IConfiguration _configuration;

        public AuthController(
            UserManager<User> userManager,
            SignInManager<User> signInManager,
            IConfiguration configuration)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _configuration = configuration;
        }

        // ✅ SIGN UP Endpoint
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

            // Add default role if needed
            await _userManager.AddToRoleAsync(user, "Member");

            return Ok(new { message = "User created successfully!" });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            try
            {
                if (request == null || string.IsNullOrEmpty(request.Email)
                    || string.IsNullOrEmpty(request.Password))
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

                // Generate JWT token
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
                Console.WriteLine($"Login error: {ex}");
                return StatusCode(500, new { message = "An internal server error occurred." });
            }
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

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            if (string.IsNullOrEmpty(request.Email))
                return BadRequest("Email is required.");

            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null)
                return Ok(); // Security: don't reveal if user doesn't exist

            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var resetLink = $"{_configuration["ClientUrl"]}/reset-password?token={WebUtility.UrlEncode(token)}&email={user.Email}";

            // In production, send email instead of returning link
            return Ok(new { ResetLink = resetLink });
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

            var result = await _userManager.ResetPasswordAsync(
                user,
                request.Token,
                request.NewPassword);

            if (!result.Succeeded)
                return BadRequest(result.Errors);

            return Ok("Password reset successfully!");
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            await _signInManager.SignOutAsync();
            return Ok(new { message = "Logged out successfully" });
        }
    }

    // DTO Classes
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