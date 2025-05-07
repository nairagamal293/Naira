using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Elite_Personal_Training.Models
{
    public enum OnlineSessionType
    {
        OneToOne = 0,
        Group = 1,
        MinGroup = 2
    }

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

        [Url]
        public string? MeetingLink { get; set; } // Optional, generated for group sessions or when booking for 1-to-1

        public int Capacity { get; set; }

        public decimal Price { get; set; }

        [Required]
        public OnlineSessionType SessionType { get; set; } // NEW: Type of session

        public bool ZoomMeetingCreated { get; set; } = false; // NEW: Track if Zoom link was generated

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public List<SessionBooking> SessionBookings { get; set; } = new List<SessionBooking>();
    }
}
