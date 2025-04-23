using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System;
using System.Collections.Generic;

namespace Elite_Personal_Training.Models
{
    public class OnlineSession
    {
        public int Id { get; set; }

        [Required]
        public string Title { get; set; }

        public string Description { get; set; }

        [ForeignKey("Trainer")]
        public int TrainerId { get; set; }
        public Trainer Trainer { get; set; }

        [Required]
        public DateTime SessionDateTime { get; set; }

        [Required]
        [Url]
        public string MeetingLink { get; set; }

        public int Capacity { get; set; }

        public decimal Price { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public List<SessionBooking> SessionBookings { get; set; } = new List<SessionBooking>();
    }
}