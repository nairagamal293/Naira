using System.ComponentModel.DataAnnotations;

namespace Elite_Personal_Training.Models
{
    public class Trainer
    {
        public int Id { get; set; }

        [Required]
        public string Name { get; set; }

        public string? Description { get; set; }
        public byte[] Image { get; set; }

        public string? SnapchatUrl { get; set; }
        public string? InstagramUrl { get; set; }
        public string? TwitterUrl { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public List<OnlineSession> OnlineSessions { get; set; } = new List<OnlineSession>();
        public List<Class> Classes { get; set; } = new List<Class>();
    }
}