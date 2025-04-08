using Elite_Personal_Training.Models;

public enum BookingStatus
{
    Pending,
    Confirmed,
    Cancelled
}

public class Booking
{
    public int Id { get; set; }

    public string UserId { get; set; }
    public User User { get; set; }

    public int? MembershipId { get; set; }
    public Membership Membership { get; set; }

    public int? ClassId { get; set; }
    public Class Class { get; set; }

    public int? OnlineSessionId { get; set; }
    public OnlineSession OnlineSession { get; set; }

    public DateTime BookingDate { get; set; } = DateTime.UtcNow;

    public decimal Price { get; set; } // 💰 Store the price
    public string Status { get; set; } = "Pending"; // Default: Pending
    public string PaymentStatus { get; set; } = "Unpaid"; // Default: Unpaid

    public string PaymentMethod { get; set; } // 💳 Payment method (Tabby, Tamara, Mada)
    public string PaymentReference { get; set; } // 🔗 Transaction reference from payment gateway

    // 🔹 Add Payment Navigation Property
    public List<Payment> Payments { get; set; } = new List<Payment>();
}
