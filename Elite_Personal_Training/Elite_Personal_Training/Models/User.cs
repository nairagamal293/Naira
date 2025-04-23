using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations.Schema;

namespace Elite_Personal_Training.Models
{
    [Table("Users")]
    public class User : IdentityUser<Guid>
    {
        public string FullName { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        public List<SessionBooking> SessionBookings { get; set; } = new List<SessionBooking>();
        public List<Booking> Bookings { get; set; } = new List<Booking>(); // Links user to bookings
    }
}