using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Elite_Personal_Training.Models;

public class BookingRequest
{
    [Required]
    [RegularExpression(@"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$",
        ErrorMessage = "UserId must be a valid GUID")]
    public Guid UserId { get; set; }
    public int? MembershipId { get; set; }
    public int? ScheduleId { get; set; } // Changed from ClassId
    public int? OnlineSessionId { get; set; }
    public decimal AmountPaid { get; set; }
    public string PaymentMethod { get; set; }
    public string? Notes { get; set; }
    public string Phone { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public BookingType BookingType { get; set; }
    public string? Status { get; set; }
    public string? PaymentStatus { get; set; }
}