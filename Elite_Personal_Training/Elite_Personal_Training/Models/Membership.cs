using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace Elite_Personal_Training.Models
{
    public class Membership
    {
        public int Id { get; set; }
        public string Name { get; set; } // e.g., Monthly, Quarterly, Yearly

        [Column(TypeName = "decimal(18,2)")] // Explicit precision
        public decimal Price { get; set; }

        public string Description { get; set; }
        public int DurationInDays { get; set; }

        public DateTime StartDate { get; set; } // When the membership starts
        public DateTime ExpiryDate => StartDate.AddDays(DurationInDays); // Auto-calculated expiry date

        public List<Booking> Bookings { get; set; } = new List<Booking>(); // Navigation property
    }
}
