using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Elite_Personal_Training.Models
{
    public class Payment
    {
        public int Id { get; set; }

        public int BookingId { get; set; }
        public Booking Booking { get; set; }

        [Column(TypeName = "decimal(18,2)")] // ✅ Ensuring proper decimal format
        public decimal AmountPaid { get; set; }

        [Required]
        public string PaymentMethod { get; set; } // 💳 (Tabby, Tamara, Mada, etc.)

        [Required]
        public string PaymentStatus { get; set; } = "Pending"; // ✅ (Pending, Completed, Failed)

        [Required]
        public string TransactionReference { get; set; } // 🔗 Transaction ID from payment gateway

        public DateTime PaymentDate { get; set; } = DateTime.UtcNow;
    }
}
