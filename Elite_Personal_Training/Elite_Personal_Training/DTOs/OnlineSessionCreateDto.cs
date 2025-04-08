using Elite_Personal_Training.Validation;
using System.ComponentModel.DataAnnotations;

namespace Elite_Personal_Training.DTOs
{
    public class OnlineSessionCreateDto
    {
        [Required(ErrorMessage = "Session title is required")]
        [StringLength(100, MinimumLength = 3, ErrorMessage = "Title must be between 3 and 100 characters")]
        public string Title { get; set; }

        [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
        public string Description { get; set; }

        [Required(ErrorMessage = "Trainer is required")]
        [Range(1, int.MaxValue, ErrorMessage = "Please select a valid trainer")]
        public int TrainerId { get; set; }


        [Required(ErrorMessage = "Session date/time is required")]
        [FutureDate(ErrorMessage = "Session must be scheduled in the future")] // Custom attribute
        public DateTime SessionDateTime { get; set; }

        [Required(ErrorMessage = "Meeting link is required")]
        [Url(ErrorMessage = "Please enter a valid URL")]
        public string MeetingLink { get; set; }

        [Range(0, 1000, ErrorMessage = "Price must be between $0 and $1000")]
        public decimal Price { get; set; }
    }
}
