using Elite_Personal_Training.Data;
using Elite_Personal_Training.DTOs;
using Elite_Personal_Training.DTOs.Elite_Personal_Training.DTOs;
using Elite_Personal_Training.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Elite_Personal_Training.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BookingController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public BookingController(ApplicationDbContext context)
        {
            _context = context;
        }

        // 1. Get a specific booking by ID
        [HttpGet("{id}")]
        public async Task<IActionResult> GetBooking(int id)
        {
            var booking = await _context.Bookings
                .Include(b => b.Membership)
                .Include(b => b.Class)
                .Include(b => b.OnlineSession)
                .Include(b => b.User)
                .FirstOrDefaultAsync(b => b.Id == id);

            if (booking == null) return NotFound();
            return Ok(booking);
        }

        // 2. Get all bookings for a specific user
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetBookingsByUser(string userId)
        {
            if (!Guid.TryParse(userId, out Guid userGuid))
                return BadRequest("Invalid UserId format.");

            var bookings = await _context.Bookings
                .Where(b => b.UserId == userGuid)
                .Include(b => b.Membership)
                .Include(b => b.Class)
                .Include(b => b.OnlineSession)
                .Include(b => b.User)
                .ToListAsync();

            return Ok(bookings);
        }

        // 3. Create a new booking
        [HttpPost]
        public async Task<IActionResult> CreateBooking([FromBody] BookingRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.UserId))
                return BadRequest("Invalid booking data.");

            if (!Guid.TryParse(request.UserId, out Guid userGuid))
                return BadRequest("Invalid UserId format.");

            bool alreadyBooked = await _context.Bookings.AnyAsync(b =>
                b.UserId == userGuid &&
                (
                    (request.MembershipId != null && b.MembershipId == request.MembershipId) ||
                    (request.ClassId != null && b.ClassId == request.ClassId) ||
                    (request.OnlineSessionId != null && b.OnlineSessionId == request.OnlineSessionId)
                ) &&
                b.Status != "Cancelled");

            if (alreadyBooked)
                return BadRequest("You already have an active booking for this item.");

            if (request.ClassId != null)
            {
                var classBookings = await _context.Bookings.CountAsync(b => b.ClassId == request.ClassId && b.Status != "Cancelled");
                var gymClass = await _context.Classes.FindAsync(request.ClassId);
                if (gymClass != null && classBookings >= gymClass.Capacity)
                    return BadRequest("Class is fully booked.");
            }

            var booking = new Booking
            {
                UserId = userGuid,
                MembershipId = request.MembershipId,
                ClassId = request.ClassId,
                OnlineSessionId = request.OnlineSessionId,
                Price = request.AmountPaid,
                PaymentMethod = request.PaymentMethod,
                Notes = request.Notes,
                BookingDate = DateTime.UtcNow,
                Phone = request.Phone,
                Name = request.Name,
                Email = request.Email,
                BookingType = request.BookingType
            };

            _context.Bookings.Add(booking);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetBooking), new { id = booking.Id }, booking);
        }

        // 4. Confirm a booking
        [HttpPost("confirm/{id}")]
        public async Task<IActionResult> ConfirmBooking(int id)
        {
            var booking = await _context.Bookings.FindAsync(id);
            if (booking == null) return NotFound();

            if (booking.Status == "Cancelled")
                return BadRequest("Cannot confirm a cancelled booking.");

            booking.Status = "Confirmed";
            booking.PaymentStatus = "Paid";
            await _context.SaveChangesAsync();

            return Ok(booking);
        }

        // 5. Cancel a booking
        [HttpPost("cancel/{id}")]
        public async Task<IActionResult> CancelBooking(int id)
        {
            var booking = await _context.Bookings.FindAsync(id);
            if (booking == null) return NotFound();

            if (booking.Status == "Cancelled")
                return BadRequest("Booking is already cancelled.");

            booking.Status = "Cancelled";
            booking.PaymentStatus = "Refunded";
            await _context.SaveChangesAsync();

            return Ok(booking);
        }

        // 6. Filter bookings by status or type
        [HttpGet("filter")]
        public async Task<IActionResult> FilterBookings([FromQuery] string? status, [FromQuery] string? type)
        {
            var query = _context.Bookings
                .Include(b => b.User)
                .Include(b => b.Membership)
                .Include(b => b.Class)
                .Include(b => b.OnlineSession)
                .AsQueryable();

            if (!string.IsNullOrEmpty(status))
                query = query.Where(b => b.Status == status);

            if (!string.IsNullOrEmpty(type))
                query = query.Where(b => b.BookingType.ToString() == type);

            var bookings = await query.OrderByDescending(b => b.BookingDate).ToListAsync();
            return Ok(bookings);
        }

        // 7. Update booking details
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateBooking(int id, [FromBody] BookingRequest request)
        {
            var booking = await _context.Bookings.FindAsync(id);
            if (booking == null) return NotFound();

            booking.Name = request.Name;
            booking.Email = request.Email;
            booking.Phone = request.Phone;
            booking.Notes = request.Notes;
            booking.PaymentMethod = request.PaymentMethod;
            booking.Price = request.AmountPaid;
            booking.Status = request.Status ?? booking.Status;
            booking.PaymentStatus = request.PaymentStatus ?? booking.PaymentStatus;

            await _context.SaveChangesAsync();
            return Ok(booking);
        }

        // 8. Delete a booking
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBooking(int id)
        {
            var booking = await _context.Bookings.FindAsync(id);
            if (booking == null) return NotFound();

            _context.Bookings.Remove(booking);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // 9. Get the next session for a user
        [HttpGet("next-session/{userId}")]
        public async Task<IActionResult> GetNextSession(string userId)
        {
            if (!Guid.TryParse(userId, out Guid userGuid))
                return BadRequest("Invalid UserId format.");

            var nextSession = await _context.Bookings
                .Where(b => b.UserId == userGuid && b.Status != "Cancelled" && b.BookingDate >= DateTime.UtcNow)
                .OrderBy(b => b.BookingDate)
                .FirstOrDefaultAsync();

            if (nextSession == null) return NotFound("No upcoming sessions found.");
            return Ok(nextSession);
        }
    }
}