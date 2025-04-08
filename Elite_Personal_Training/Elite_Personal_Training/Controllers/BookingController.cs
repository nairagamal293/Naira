using Elite_Personal_Training.Data;
using Elite_Personal_Training.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace Elite_Personal_Training.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class BookingController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public BookingController(ApplicationDbContext context)
        {
            _context = context;
        }

        // ✅ Get all bookings (Admin only)
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<Booking>>> GetAllBookings()
        {
            return await _context.Bookings
                .Include(b => b.Class)
                .Include(b => b.User)
                .ToListAsync();
        }

        // ✅ Get bookings for the logged-in user
        [HttpGet("my-bookings")]
        public async Task<ActionResult<IEnumerable<Booking>>> GetMyBookings()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return await _context.Bookings
                .Where(b => b.UserId == userId)
                .Include(b => b.Class)
                .Include(b => b.Payments)
                .ToListAsync();
        }

        // ✅ Create a booking (with validations)
        [HttpPost]
        public async Task<ActionResult<Booking>> CreateBooking([FromBody] Booking booking)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return Unauthorized();

            booking.UserId = userId;

            // Check class exists
            var classObj = await _context.Classes.FindAsync(booking.ClassId);
            if (classObj == null) return NotFound("Class not found.");

            // Prevent duplicate booking
            bool alreadyBooked = await _context.Bookings
                .AnyAsync(b => b.UserId == userId && b.ClassId == booking.ClassId && b.Status != "Cancelled");
            if (alreadyBooked) return BadRequest("You already booked this class.");

            // Check capacity
            int currentBookings = await _context.Bookings.CountAsync(b => b.ClassId == booking.ClassId && b.Status == "Confirmed");
            if (currentBookings >= classObj.Capacity)
                return BadRequest("Class is fully booked.");

            booking.BookingDate = DateTime.UtcNow;
            booking.Status = "Pending"; // until payment succeeds

            _context.Bookings.Add(booking);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetMyBookings), new { id = booking.Id }, booking);
        }

        // ✅ Cancel a booking
        [HttpDelete("{id}")]
        public async Task<IActionResult> CancelBooking(int id)
        {
            var booking = await _context.Bookings.Include(b => b.User).FirstOrDefaultAsync(b => b.Id == id);
            if (booking == null) return NotFound();

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (booking.UserId != userId && !User.IsInRole("Admin"))
                return Forbid();

            booking.Status = "Cancelled";
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
