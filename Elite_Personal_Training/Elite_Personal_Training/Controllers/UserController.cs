using Elite_Personal_Training.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;

namespace Elite_Personal_Training.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(AuthenticationSchemes = "Bearer")]
    public class UserController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly IWebHostEnvironment _environment;
        private readonly IConfiguration _configuration;
        private readonly ILogger<UserController> _logger;

        public UserController(
            UserManager<User> userManager,
            IWebHostEnvironment environment,
            IConfiguration configuration,
            ILogger<UserController> logger)
        {
            _userManager = userManager;
            _environment = environment;
            _configuration = configuration;
            _logger = logger;
        }

        // Get all users (Admin only)
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _userManager.Users
                .Select(u => new
                {
                    u.Id,
                    u.FullName,
                    u.Email,
                    u.PhoneNumber,
                    u.NationalId,
                    u.Gender,
                    DateOfBirth = u.DateOfBirth.HasValue ? u.DateOfBirth.Value.ToString("yyyy-MM-dd") : null,
                    u.Address,
                    u.City,
                    u.Region,
                    u.PostalCode,
                    ProfilePictureUrl = GetProfilePictureUrl(u.ProfilePicturePath),
                    Roles = _userManager.GetRolesAsync(u).Result
                })
                .ToListAsync();

            return Ok(users);
        }

        // Get current user details
        [HttpGet("me")]
        public async Task<IActionResult> GetCurrentUser()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
                return Unauthorized("Invalid token.");

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return NotFound("User not found.");

            return Ok(new
            {
                user.Id,
                user.FirstName,
                user.LastName,
                user.FullName,
                user.Email,
                user.PhoneNumber,
                user.NationalId,
                user.Gender,
                DateOfBirth = user.DateOfBirth.HasValue ? user.DateOfBirth.Value.ToString("yyyy-MM-dd") : null,
                user.Address,
                user.City,
                user.Region,
                user.PostalCode,
                ProfilePictureUrl = GetProfilePictureUrl(user.ProfilePicturePath),
                Roles = await _userManager.GetRolesAsync(user)
            });
        }

        // Get user by ID (Admin only)
        [HttpGet("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetUserById(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
                return NotFound("User not found.");

            return Ok(new
            {
                user.Id,
                user.FirstName,
                user.LastName,
                user.FullName,
                user.Email,
                user.PhoneNumber,
                user.NationalId,
                user.Gender,
                DateOfBirth = user.DateOfBirth.HasValue ? user.DateOfBirth.Value.ToString("yyyy-MM-dd") : null,
                user.Address,
                user.City,
                user.Region,
                user.PostalCode,
                ProfilePictureUrl = GetProfilePictureUrl(user.ProfilePicturePath),
                Roles = await _userManager.GetRolesAsync(user)
            });
        }

        // Update user profile
        [HttpPut("update")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto model)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
                return Unauthorized("Invalid token.");

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return NotFound("User not found.");

            // Update basic info
            if (!string.IsNullOrEmpty(model.FirstName)) user.FirstName = model.FirstName;
            if (!string.IsNullOrEmpty(model.LastName)) user.LastName = model.LastName;
            user.FullName = $"{model.FirstName} {model.LastName}";
            if (!string.IsNullOrEmpty(model.NationalId)) user.NationalId = model.NationalId;
            if (!string.IsNullOrEmpty(model.Gender)) user.Gender = model.Gender;
            if (model.DateOfBirth.HasValue) user.DateOfBirth = model.DateOfBirth;
            if (!string.IsNullOrEmpty(model.PhoneNumber)) user.PhoneNumber = model.PhoneNumber;
            if (!string.IsNullOrEmpty(model.Address)) user.Address = model.Address;
            if (!string.IsNullOrEmpty(model.City)) user.City = model.City;
            if (!string.IsNullOrEmpty(model.Region)) user.Region = model.Region;
            if (!string.IsNullOrEmpty(model.PostalCode)) user.PostalCode = model.PostalCode;

            user.UpdatedAt = DateTime.UtcNow;

            // Update password if provided
            if (!string.IsNullOrEmpty(model.NewPassword) && !string.IsNullOrEmpty(model.CurrentPassword))
            {
                var changePasswordResult = await _userManager.ChangePasswordAsync(user, model.CurrentPassword, model.NewPassword);
                if (!changePasswordResult.Succeeded)
                {
                    return BadRequest(new { Errors = changePasswordResult.Errors.Select(e => e.Description) });
                }
            }

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                return BadRequest(new { Errors = result.Errors.Select(e => e.Description) });
            }

            return Ok(new
            {
                user.Id,
                user.FullName,
                user.Email,
                user.PhoneNumber,
                user.NationalId,
                user.Gender,
                DateOfBirth = user.DateOfBirth?.ToString("yyyy-MM-dd"),
                user.Address,
                user.City,
                user.Region,
                user.PostalCode,
                ProfilePictureUrl = GetProfilePictureUrl(user.ProfilePicturePath)
            });
        }

        [HttpPost("upload-profile-picture")]
        public async Task<IActionResult> UploadProfilePicture(IFormFile file)
        {
            try
            {
                // Verify authentication
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (userId == null)
                {
                    return Unauthorized("Invalid token.");
                }

                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    return NotFound("User not found.");
                }

                // Validate file
                if (file == null || file.Length == 0)
                {
                    return BadRequest("No file uploaded.");
                }

                // Ensure WebRootPath exists
                if (string.IsNullOrEmpty(_environment.WebRootPath))
                {
                    _environment.WebRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                }

                // Create upload directory path
                var uploadsDir = Path.Combine(_environment.WebRootPath, "uploads", "profile-pictures");

                // Ensure directory exists
                if (!Directory.Exists(uploadsDir))
                {
                    Directory.CreateDirectory(uploadsDir);
                }

                // Generate safe filename
                var extension = Path.GetExtension(file.FileName)?.ToLowerInvariant() ?? ".dat";
                var fileName = $"{Guid.NewGuid()}{extension}";
                var filePath = Path.Combine(uploadsDir, fileName);

                // Save file
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // Clean up old file if exists
                if (!string.IsNullOrEmpty(user.ProfilePicturePath))
                {
                    var oldFilePath = Path.Combine(_environment.WebRootPath, user.ProfilePicturePath);
                    if (System.IO.File.Exists(oldFilePath))
                    {
                        System.IO.File.Delete(oldFilePath);
                    }
                }

                // Update user
                user.ProfilePicturePath = Path.Combine("uploads", "profile-pictures", fileName).Replace("\\", "/");
                user.UpdatedAt = DateTime.UtcNow;

                var result = await _userManager.UpdateAsync(user);
                if (!result.Succeeded)
                {
                    // Clean up if update fails
                    if (System.IO.File.Exists(filePath))
                    {
                        System.IO.File.Delete(filePath);
                    }
                    return BadRequest(result.Errors);
                }

                return Ok(new
                {
                    ProfilePictureUrl = GetProfilePictureUrl(user.ProfilePicturePath)
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = "An error occurred while uploading the file",
                    details = ex.Message
                });
            }
        }

        // Delete user (Admin only)
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteUser(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
                return NotFound("User not found.");

            // Delete profile picture if exists
            if (!string.IsNullOrEmpty(user.ProfilePicturePath))
            {
                var filePath = Path.Combine(_environment.WebRootPath, user.ProfilePicturePath);
                if (System.IO.File.Exists(filePath))
                {
                    System.IO.File.Delete(filePath);
                }
            }

            var result = await _userManager.DeleteAsync(user);
            if (!result.Succeeded)
            {
                return BadRequest(new { Errors = result.Errors.Select(e => e.Description) });
            }

            return Ok("User deleted successfully.");
        }

        // Helper method to get full profile picture URL
        private string GetProfilePictureUrl(string path)
        {
            if (string.IsNullOrEmpty(path))
            {
                // Return a default avatar URL if no profile picture exists
                var defaultAvatarName = "DefaultUser";
                var user = _userManager.FindByIdAsync(User.FindFirstValue(ClaimTypes.NameIdentifier)).Result;
                if (user != null)
                {
                    defaultAvatarName = Uri.EscapeDataString(user.FullName ?? "User");
                }
                return $"https://ui-avatars.com/api/?name={defaultAvatarName}&background=9c0d0d&color=fff&size=200";
            }

            // Ensure path doesn't start with a slash to avoid double slashes
            var cleanPath = path.TrimStart('/');
            return $"{Request.Scheme}://{Request.Host}/{cleanPath.Replace('\\', '/')}";
        }
    }
}