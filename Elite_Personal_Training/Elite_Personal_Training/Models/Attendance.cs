namespace Elite_Personal_Training.Models
{
    public class Attendance
    {
        public int Id { get; set; }
        public int BookingId { get; set; }
        public bool Attended { get; set; }
        public DateTime CheckedInAt { get; set; }
        public string Notes { get; set; }
    }
}
