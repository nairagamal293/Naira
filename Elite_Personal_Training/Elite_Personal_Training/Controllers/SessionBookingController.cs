using Elite_Personal_Training.Data;
using Elite_Personal_Training.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Elite_Personal_Training.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class SessionBookingController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SessionBookingController(ApplicationDbContext context)
        {
            _context = context;
        }

        // Get all session bookings (Admin Only)
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<SessionBooking>>> GetSessionBookings()
        {
            return await _context.SessionBookings
                .Include(sb => sb.OnlineSession)
                .Include(sb => sb.User)
                .ToListAsync();
        }

        // Get bookings for the logged-in user
        [HttpGet("my-bookings")]
        public async Task<ActionResult<IEnumerable<SessionBooking>>> GetUserSessionBookings()
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdString, out Guid userId))
            {
                return BadRequest("Invalid user ID format");
            }

            return await _context.SessionBookings
                .Where(sb => sb.UserId == userId)
                .Include(sb => sb.OnlineSession)
                .ToListAsync();
        }

        // Book an online session
        [HttpPost]
        public async Task<ActionResult<SessionBooking>> CreateSessionBooking(SessionBooking sessionBooking)
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdString, out Guid userId))
            {
                return BadRequest("Invalid user ID format");
            }

            sessionBooking.UserId = userId;
            sessionBooking.BookingDate = DateTime.UtcNow;

            // Check if the session exists
            var sessionExists = await _context.OnlineSessions
                .AnyAsync(os => os.Id == sessionBooking.OnlineSessionId);

            if (!sessionExists)
            {
                return BadRequest("The specified online session does not exist");
            }

            _context.SessionBookings.Add(sessionBooking);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetSessionBookings), new { id = sessionBooking.Id }, sessionBooking);
        }

        // Delete a booking (Admin or the user who booked)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSessionBooking(int id)
        {
            var sessionBooking = await _context.SessionBookings.FindAsync(id);
            if (sessionBooking == null)
            {
                return NotFound();
            }

            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdString, out Guid userId))
            {
                return BadRequest("Invalid user ID format");
            }

            if (sessionBooking.UserId != userId && !User.IsInRole("Admin"))
            {
                return Forbid();
            }

            _context.SessionBookings.Remove(sessionBooking);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}