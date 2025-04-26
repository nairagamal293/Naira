using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations.Schema;

namespace Elite_Personal_Training.Models
{
    [Table("Users")]
    public class User : IdentityUser<Guid>
    {
        public string FullName { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? NationalId { get; set; } // For Saudi users (Iqama/National ID)
        public string? Gender { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string? ProfilePicturePath { get; set; } // Store path to uploaded image
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? Region { get; set; } // Instead of State for Saudi regions
        public string? PostalCode { get; set; }
        public string? Country { get; set; } = "Saudi Arabia"; // Default value
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        public List<SessionBooking> SessionBookings { get; set; } = new List<SessionBooking>();
        public List<Booking> Bookings { get; set; } = new List<Booking>();
    }
}