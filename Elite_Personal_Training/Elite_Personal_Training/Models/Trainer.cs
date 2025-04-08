using System.ComponentModel.DataAnnotations;

namespace Elite_Personal_Training.Models
{
    public class Trainer
    {
        public int Id { get; set; }

        [Required]
        public string Name { get; set; }

        public string? Description { get; set; } // Optional description
        public byte[] Image { get; set; } // ✅ Store image as byte array

        // ✅ Optional Social Media Links
        public string? SnapchatUrl { get; set; }
        public string? InstagramUrl { get; set; }
        public string? TwitterUrl { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // ✅ Navigation Property (Trainer can have multiple online sessions)
        public List<OnlineSession> OnlineSessions { get; set; } = new List<OnlineSession>();
    }
}
