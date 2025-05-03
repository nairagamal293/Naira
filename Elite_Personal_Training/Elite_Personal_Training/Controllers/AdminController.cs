using Elite_Personal_Training.Data;
using Elite_Personal_Training.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Elite_Personal_Training.Controllers
{
    [Authorize(Roles = "Admin")]
    [Route("api/[controller]")]
    [ApiController]
    public class AdminController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<User> _userManager;

        public AdminController(ApplicationDbContext context, UserManager<User> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        [HttpGet("analytics")]
        public async Task<IActionResult> GetAnalytics()
        {
            try
            {
                var totalUsers = await _userManager.Users.CountAsync();
                var activeMemberships = await _context.Memberships.CountAsync();
                var totalBookings = await _context.Bookings.CountAsync();
                var revenue = await _context.Payments.SumAsync(p => p.AmountPaid);

                return Ok(new
                {
                    totalUsers,
                    activeMemberships,
                    totalBookings,
                    revenue
                });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching analytics", error = ex.Message });
            }
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers()
        {
            try
            {
                var users = await _userManager.Users.ToListAsync();
                return Ok(users);
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching users", error = ex.Message });
            }
        }

        [HttpGet("bookings")]
        public async Task<IActionResult> GetBookings()
        {
            try
            {
                var bookings = await _context.Bookings
                    .Include(b => b.User)
                    .Include(b => b.Schedule)
                        .ThenInclude(s => s.Class)
                    .Include(b => b.Schedule)
                        .ThenInclude(s => s.Trainer)
                    .Include(b => b.OnlineSession)
                    .ToListAsync();

                var result = bookings.Select(b => new
                {
                    b.Id,
                    b.BookingDate,
                    b.Status,
                    b.PaymentStatus,
                    User = b.User != null ? new { b.User.Id, b.User.Email, b.User.UserName } : null,
                    Schedule = b.Schedule != null ? new
                    {
                        b.Schedule.Id,
                        b.Schedule.ScheduleDate,
                        StartTime = b.Schedule.StartTime.ToString(@"hh\:mm"),
                        EndTime = b.Schedule.EndTime.ToString(@"hh\:mm"),
                        ClassName = b.Schedule.Class?.Name,
                        TrainerName = b.Schedule.Trainer?.Name
                    } : null,
                    OnlineSession = b.OnlineSession != null ? new { b.OnlineSession.Id, b.OnlineSession.Title } : null
                });

                return Ok(result);
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching bookings", error = ex.Message });
            }
        }

        [HttpGet("session-bookings")]
        public async Task<IActionResult> GetSessionBookings()
        {
            try
            {
                var sessionBookings = await _context.SessionBookings
                    .Include(sb => sb.User)
                    .Include(sb => sb.OnlineSession)
                    .ToListAsync();
                return Ok(sessionBookings);
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching session bookings", error = ex.Message });
            }
        }

        [HttpPost("promote/{userId}")]
        public async Task<IActionResult> PromoteUserToAdmin(string userId)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user == null) return NotFound(new { message = "User not found" });

                var isAdmin = await _userManager.IsInRoleAsync(user, "Admin");
                if (isAdmin)
                    return BadRequest(new { message = "User is already an Admin" });

                await _userManager.AddToRoleAsync(user, "Admin");
                return Ok(new { message = "User promoted to Admin successfully" });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { message = "Error promoting user", error = ex.Message });
            }
        }

        [HttpDelete("users/{userId}")]
        public async Task<IActionResult> DeleteUser(string userId)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user == null) return NotFound(new { message = "User not found" });

                await _userManager.DeleteAsync(user);
                return Ok(new { message = "User deleted successfully" });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { message = "Error deleting user", error = ex.Message });
            }
        }

        [HttpGet("available-schedules")]
        public async Task<IActionResult> GetAvailableSchedules()
        {
            try
            {
                var now = DateTime.UtcNow;

                var availableSchedules = await _context.Schedules
                    .Include(s => s.Class)
                    .Include(s => s.Trainer)
                    .Where(s => s.ScheduleDate > now.Date ||
                               (s.ScheduleDate == now.Date && s.EndTime > now.TimeOfDay))
                    .Select(s => new
                    {
                        s.Id,
                        s.ScheduleDate,
                        StartTime = s.StartTime.ToString(@"hh\:mm"),
                        EndTime = s.EndTime.ToString(@"hh\:mm"),
                        ClassName = s.Class.Name,
                        TrainerName = s.Trainer.Name,
                        AvailableSpots = s.Class.Capacity - _context.Bookings.Count(b => b.ScheduleId == s.Id && b.Status != "Cancelled")
                    })
                    .Where(s => s.AvailableSpots > 0)
                    .ToListAsync();

                return Ok(availableSchedules);
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching available schedules", error = ex.Message });
            }
        }
    }
}