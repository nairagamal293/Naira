using System.Text.Json.Serialization;


namespace Elite_Personal_Training.DTOs
{
    using System.Text.Json.Serialization;

    namespace Elite_Personal_Training.DTOs
    {
        public class BookingRequest
        {
            public string UserId { get; set; }
            public int? MembershipId { get; set; }
            public int? ClassId { get; set; }
            public int? OnlineSessionId { get; set; }

            public decimal AmountPaid { get; set; }
            public string PaymentMethod { get; set; }
            public string? Notes { get; set; }

            public string Phone { get; set; }
            public string Name { get; set; }
            public string Email { get; set; }

            [JsonConverter(typeof(JsonStringEnumConverter))]
            public BookingType BookingType { get; set; }

            // ✅ Add these two (optional for admin update)
            public string? Status { get; set; }
            public string? PaymentStatus { get; set; }
        }
    }



}
