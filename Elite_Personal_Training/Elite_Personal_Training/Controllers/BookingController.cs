using Elite_Personal_Training.Data;
using Elite_Personal_Training.DTOs;
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
        [HttpGet("all")]
        public async Task<IActionResult> GetAllBookings()
        {
            var bookings = await _context.Bookings
                .Include(b => b.Membership)
                .Include(b => b.Schedule)
                .Include(b => b.OnlineSession)
                .ToListAsync();

            return Ok(bookings);
        }


        [HttpGet("{id}")]
        public async Task<IActionResult> GetBooking(int id)
        {
            var booking = await _context.Bookings
                .Include(b => b.Membership)
                .Include(b => b.Schedule)
                    .ThenInclude(s => s.Class)
                .Include(b => b.Schedule)
                    .ThenInclude(s => s.Trainer)
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

            // Check for existing bookings
            bool alreadyBooked = await _context.Bookings.AnyAsync(b =>
                b.UserId == request.UserId &&
                (
                    (request.MembershipId != null && b.MembershipId == request.MembershipId) ||
                    (request.ScheduleId != null && b.ScheduleId == request.ScheduleId) ||
                    (request.OnlineSessionId != null && b.OnlineSessionId == request.OnlineSessionId)
                ) &&
                b.Status != "Cancelled");

            if (alreadyBooked)
                return BadRequest("You already have an active booking for this item.");

            // Check schedule availability
            if (request.ScheduleId != null)
            {
                var schedule = await _context.Schedules
                    .Include(s => s.Class)
                    .FirstOrDefaultAsync(s => s.Id == request.ScheduleId);

                if (schedule == null)
                    return BadRequest("Schedule not found.");

                var bookingsCount = await _context.Bookings
                    .CountAsync(b => b.ScheduleId == request.ScheduleId && b.Status != "Cancelled");

                if (schedule.Class != null && bookingsCount >= schedule.Class.Capacity)
                    return BadRequest("This schedule is fully booked.");
            }

            // Handle membership dates
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
                ScheduleId = request.ScheduleId,
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

        // ... [Keep all other existing methods but update any references to ClassId to ScheduleId]

        [HttpGet("available-online-sessions")]
        public async Task<IActionResult> GetAvailableOnlineSessions()
        {
            var now = DateTime.UtcNow;

            var availableSessions = await _context.OnlineSessions
                .Where(s => s.SessionDateTime > now)
                .ToListAsync();

            return Ok(availableSessions);
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
        // Update the FilterBookings method:
        [HttpGet("filter")]
        public async Task<IActionResult> FilterBookings(string status, string type)
        {
            try
            {
                // Parse enum value safely
                if (!Enum.TryParse<BookingType>(type, true, out var bookingTypeEnum))
                {
                    return BadRequest("Invalid booking type.");
                }

                var filteredBookings = await _context.Bookings
                    .Where(b => b.Status == status && b.BookingType == bookingTypeEnum)
                    .ToListAsync();

                return Ok(filteredBookings);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }


        // Update the GetBookingsByUser method:
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetBookingsByUser(Guid userId)
        {
            var bookings = await _context.Bookings
                .Where(b => b.UserId == userId)
                .Include(b => b.Membership)
                .Include(b => b.Schedule)
                    .ThenInclude(s => s.Class)
                .Include(b => b.Schedule)
                    .ThenInclude(s => s.Trainer)
                .Include(b => b.OnlineSession)
                .OrderByDescending(b => b.BookingDate)
                .ToListAsync();

            return bookings.Any() ? Ok(bookings) : NotFound($"No bookings found for user with ID: {userId}");
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
        // Add a new endpoint for available schedules:
        [HttpGet("available-schedules")]
        public async Task<IActionResult> GetAvailableSchedules()
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
    }
}