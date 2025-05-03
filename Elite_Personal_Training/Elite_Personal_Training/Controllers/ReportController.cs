using Elite_Personal_Training.Data;
using Elite_Personal_Training.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Elite_Personal_Training.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReportController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ReportController(ApplicationDbContext context)
        {
            _context = context;
        }

        // 1. BOOKING REPORTS
        [HttpGet("bookings/summary")]
        public async Task<IActionResult> GetBookingSummary(
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate)
        {
            var query = _context.Bookings.AsQueryable();

            if (startDate.HasValue)
                query = query.Where(b => b.BookingDate >= startDate);

            if (endDate.HasValue)
                query = query.Where(b => b.BookingDate <= endDate);

            var summary = await query
                .GroupBy(b => b.BookingType)
                .Select(g => new
                {
                    BookingType = g.Key.ToString(),
                    TotalBookings = g.Count(),
                    TotalRevenue = g.Sum(b => b.Price),
                    Pending = g.Count(b => b.Status == "Pending"),
                    Confirmed = g.Count(b => b.Status == "Confirmed"),
                    Cancelled = g.Count(b => b.Status == "Cancelled")
                })
                .ToListAsync();

            return Ok(summary);
        }

        // 2. PAYMENT REPORTS
        [HttpGet("payments/summary")]
        public async Task<IActionResult> GetPaymentSummary(
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate)
        {
            var query = _context.Payments
                .Include(p => p.Booking)
                .AsQueryable();

            if (startDate.HasValue)
                query = query.Where(p => p.PaymentDate >= startDate);

            if (endDate.HasValue)
                query = query.Where(p => p.PaymentDate <= endDate);

            var summary = await query
                .GroupBy(p => p.PaymentStatus)
                .Select(g => new
                {
                    Status = g.Key,
                    Count = g.Count(),
                    TotalAmount = g.Sum(p => p.AmountPaid),
                    PaymentMethods = g.GroupBy(p => p.PaymentMethod)
                                     .Select(m => new
                                     {
                                         Method = m.Key,
                                         Count = m.Count(),
                                         Amount = m.Sum(p => p.AmountPaid)
                                     })
                })
                .ToListAsync();

            return Ok(summary);
        }



        // 4. FINANCIAL REPORT (Combined bookings and payments)
        [HttpGet("financial")]
        public async Task<IActionResult> GetFinancialReport(
            [FromQuery] DateTime startDate,
            [FromQuery] DateTime endDate)
        {
            var bookings = await _context.Bookings
                .Where(b => b.BookingDate >= startDate && b.BookingDate <= endDate)
                .ToListAsync();

            var payments = await _context.Payments
                .Where(p => p.PaymentDate >= startDate && p.PaymentDate <= endDate)
                .ToListAsync();

            var result = new
            {
                TotalRevenue = bookings.Sum(b => b.Price),
                ReceivedPayments = payments.Where(p => p.PaymentStatus == "Completed").Sum(p => p.AmountPaid),
                OutstandingPayments = bookings.Where(b => b.PaymentStatus != "Paid").Sum(b => b.Price),
                PaymentMethods = payments.GroupBy(p => p.PaymentMethod)
                                        .Select(g => new
                                        {
                                            Method = g.Key,
                                            Amount = g.Sum(p => p.AmountPaid),
                                            Count = g.Count()
                                        }),
                RevenueByType = bookings.GroupBy(b => b.BookingType)
                                       .Select(g => new
                                       {
                                           Type = g.Key.ToString(),
                                           Amount = g.Sum(b => b.Price),
                                           Count = g.Count()
                                       })
            };

            return Ok(result);
        }

        // 5. ATTENDANCE REPORT (optional - only if implemented)
        [HttpGet("attendance/summary")]
        public async Task<IActionResult> GetAttendanceSummary(
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate)
        {
            try
            {
                // Check if Attendances is implemented
                var attendanceQuery = _context.Bookings
                    .Where(b => b.Status == "Confirmed")
                    .AsQueryable();

                if (startDate.HasValue)
                    attendanceQuery = attendanceQuery.Where(b => b.BookingDate >= startDate);

                if (endDate.HasValue)
                    attendanceQuery = attendanceQuery.Where(b => b.BookingDate <= endDate);

                var summary = await attendanceQuery
                    .GroupBy(b => b.BookingType)
                    .Select(g => new
                    {
                        BookingType = g.Key.ToString(),
                        TotalSessions = g.Count(),
                        // This is a placeholder - actual attendance would need the Attendance table
                        AttendanceRate = 75.0m // Default placeholder value
                    })
                    .ToListAsync();

                return Ok(new
                {
                    Message = "Basic attendance summary (full tracking not implemented)",
                    Data = summary
                });
            }
            catch (Exception ex)
            {
                return Ok(new
                {
                    Message = "Attendance tracking is not fully implemented",
                    Note = "Implement the Attendance model and controller to enable detailed tracking"
                });
            }
        }
    }
}