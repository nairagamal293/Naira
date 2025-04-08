using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Elite_Personal_Training.Models
{
    public enum BookingStatus
    {
        Pending,
        Confirmed,
        Cancelled
    }

    public class SessionBooking
    {
        public int Id { get; set; }

        [Required]
        public string UserId { get; set; } = "";
        public User User { get; set; } = new User();

        [ForeignKey("OnlineSession")]
        public int OnlineSessionId { get; set; }
        public OnlineSession OnlineSession { get; set; } = new OnlineSession();

        public DateTime BookingDate { get; set; } = DateTime.UtcNow;
        public string Status { get; set; } = "Pending";
    }
}
