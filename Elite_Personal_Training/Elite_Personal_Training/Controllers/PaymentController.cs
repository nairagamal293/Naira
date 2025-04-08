using Elite_Personal_Training.Data;
using Elite_Personal_Training.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Elite_Personal_Training.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PaymentController(ApplicationDbContext context)
        {
            _context = context;
        }

        // ✅ Admin: Get all payments
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Payment>>> GetPayments()
        {
            return await _context.Payments
                .Include(p => p.Booking)
                .ToListAsync();
        }

        // ✅ Get payment by ID
        [HttpGet("{id}")]
        public async Task<ActionResult<Payment>> GetPayment(int id)
        {
            var payment = await _context.Payments
                .Include(p => p.Booking)
                .FirstOrDefaultAsync(p => p.Id == id);
            if (payment == null) return NotFound();
            return payment;
        }

        // ✅ Create payment (pending status)
        [HttpPost]
        public async Task<ActionResult<Payment>> CreatePayment(Payment payment)
        {
            var booking = await _context.Bookings.FindAsync(payment.BookingId);
            if (booking == null) return NotFound("Booking not found");

            payment.PaymentStatus = "Pending";

            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetPayment), new { id = payment.Id }, payment);
        }

        // ✅ Update payment status
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePayment(int id, [FromBody] Payment updatedPayment)
        {
            if (id != updatedPayment.Id) return BadRequest();

            var payment = await _context.Payments.Include(p => p.Booking).FirstOrDefaultAsync(p => p.Id == id);
            if (payment == null) return NotFound();

            payment.PaymentStatus = updatedPayment.PaymentStatus;
            payment.TransactionReference = updatedPayment.TransactionReference;

            // Update booking status if payment successful
            if (payment.Booking != null && updatedPayment.PaymentStatus == "Completed")
            {
                payment.Booking.Status = "Confirmed";
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
