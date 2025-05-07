using Elite_Personal_Training.Validation;
using System.ComponentModel.DataAnnotations;

namespace Elite_Personal_Training.DTOs
{
    public class OnlineSessionUpdateDto
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "Session title is required")]
        [StringLength(100, MinimumLength = 3, ErrorMessage = "Title must be between 3 and 100 characters")]
        public string Title { get; set; }

        [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
        public string Description { get; set; }

        [Required(ErrorMessage = "Trainer is required")]
        [Range(1, int.MaxValue, ErrorMessage = "Please select a valid trainer")]
        public int TrainerId { get; set; }

        [Required(ErrorMessage = "Session date/time is required")]
        [FutureDate(ErrorMessage = "Session must be scheduled in the future")]
        public DateTime SessionDateTime { get; set; }

        [Range(0, 1000, ErrorMessage = "Price must be between $0 and $1000")]
        public decimal Price { get; set; }

        [Required(ErrorMessage = "Session type is required")]
        [Range(0, 2, ErrorMessage = "Invalid session type (0 = OneToOne, 1 = Group, 2 = MinGroup)")]
        public int SessionType { get; set; }

        [Range(0, 50, ErrorMessage = "Capacity must be between 0 and 50")]
        public int Capacity { get; set; }

        [Url(ErrorMessage = "Please enter a valid URL")]
        public string? MeetingLink { get; set; } // Optional: can be generated
    }
}
