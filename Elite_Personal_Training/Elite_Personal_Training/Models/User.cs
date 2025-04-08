using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations.Schema;

namespace Elite_Personal_Training.Models
{
    [Table("Users")] // 👈 This forces the table name to be "Users"
    public class User : IdentityUser
    {
        public string FullName { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // ✅ Navigation Property
        public List<SessionBooking> SessionBookings { get; set; } = new List<SessionBooking>();
    }
}
