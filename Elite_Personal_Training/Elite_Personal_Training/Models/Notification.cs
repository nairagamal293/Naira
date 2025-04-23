namespace Elite_Personal_Training.Models
{
    public class Notification
    {
        public int Id { get; set; }
        public Guid UserId { get; set; }
        public string Message { get; set; }
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
