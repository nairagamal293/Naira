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



        [HttpPost]
        public async Task<IActionResult> CreateBooking([FromBody] BookingRequest request)
        {
            if (request == null || request.UserId == Guid.Empty)
                return BadRequest("Invalid booking data.");

            bool alreadyBooked = await _context.Bookings.AnyAsync(b =>
                b.UserId == request.UserId &&  // Now using Guid comparison
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

            DateTime? membershipStart = null;
            DateTime? membershipEnd = null;

            if (request.MembershipId.HasValue)
            {
                var membership = await _context.Memberships.FindAsync(request.MembershipId.Value);
                if (membership == null)
                    return BadRequest("Membership not found.");

                membershipStart = DateTime.UtcNow;
                membershipEnd = membershipStart.Value.AddDays(membership.DurationInDays);
            }

            var booking = new Booking
            {
                UserId = request.UserId,
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
                BookingType = request.BookingType,
                MembershipStartDate = membershipStart,
                MembershipEndDate = membershipEnd
            };

            _context.Bookings.Add(booking);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetBooking), new { id = booking.Id }, booking);
        }

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

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBooking(int id)
        {
            var booking = await _context.Bookings.FindAsync(id);
            if (booking == null) return NotFound();

            _context.Bookings.Remove(booking);
            await _context.SaveChangesAsync();
            return NoContent();
        }


        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetBookingsByUser(Guid userId)
        {
            var bookings = await _context.Bookings
                .Where(b => b.UserId == userId)
                .Include(b => b.Membership)
                .Include(b => b.Class)
                .Include(b => b.OnlineSession)
                .OrderByDescending(b => b.BookingDate)
                .ToListAsync();

            if (!bookings.Any())
            {
                return NotFound($"No bookings found for user with ID: {userId}");
            }

            return Ok(bookings);
        }

        [HttpGet("next-session/{userId}")]
        public async Task<IActionResult> GetNextSession(Guid userId)  // Changed from string to Guid
        {
            var nextSession = await _context.Bookings
                .Where(b => b.UserId == userId && b.Status != "Cancelled" && b.BookingDate >= DateTime.UtcNow)
                .OrderBy(b => b.BookingDate)
                .FirstOrDefaultAsync();

            if (nextSession == null) return NotFound("No upcoming sessions found.");
            return Ok(nextSession);
        }

        [HttpGet("available-classes")]
        public async Task<IActionResult> GetAvailableClasses()
        {
            var availableClasses = await _context.Classes
                .Include(c => c.Schedules)
                .Where(c =>
                    !_context.Bookings
                        .Where(b => b.ClassId == c.Id && b.Status != "Cancelled")
                        .GroupBy(b => b.ClassId)
                        .Select(g => new { ClassId = g.Key, Count = g.Count() })
                        .Any(g => g.ClassId == c.Id && g.Count >= c.Capacity)
                )
                .ToListAsync();

            return Ok(availableClasses);
        }


        [HttpGet("available-online-sessions")]
        public async Task<IActionResult> GetAvailableOnlineSessions()
        {
            var now = DateTime.UtcNow;

            var availableSessions = await _context.OnlineSessions
                .Where(s => s.SessionDateTime > now)
                .ToListAsync();

            return Ok(availableSessions);
        }
    }
}
