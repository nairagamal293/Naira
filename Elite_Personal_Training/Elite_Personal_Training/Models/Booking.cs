using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace Elite_Personal_Training.Models
{
    public enum BookingType
    {
        Membership = 1,
        Class = 2,
        OnlineSession = 3
    }

    public class Booking
    {
        public int Id { get; set; }
        public Guid UserId { get; set; }

        [ForeignKey(nameof(UserId))]
        public User? User { get; set; }

        public int? MembershipId { get; set; }
        public Membership? Membership { get; set; }

        // Replace ClassId with ScheduleId
        public int? ScheduleId { get; set; }
        [ForeignKey(nameof(ScheduleId))]
        public Schedule? Schedule { get; set; }

        public int? OnlineSessionId { get; set; }
        public OnlineSession? OnlineSession { get; set; }

        // Rest of the properties remain the same
        public DateTime? BookingDate { get; set; } = DateTime.UtcNow;
        public decimal Price { get; set; }
        public string Status { get; set; } = "Pending";
        public string PaymentStatus { get; set; } = "Unpaid";
        public string? PaymentReference { get; set; }
        public string? PaymentMethod { get; set; }
        public DateTime? PaymentDate { get; set; }
        public List<Payment> Payments { get; set; } = new List<Payment>();
        public string? Notes { get; set; }
        public string Phone { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public BookingType BookingType { get; set; }
        public DateTime? MembershipStartDate { get; set; }
        public DateTime? MembershipEndDate { get; set; }
    }
}
