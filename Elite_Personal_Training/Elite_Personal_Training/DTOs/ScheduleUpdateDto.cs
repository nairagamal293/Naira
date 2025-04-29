namespace Elite_Personal_Training.DTOs
{
    public class ScheduleCreateDto
    {
        public int ClassId { get; set; }
        public DateTime ScheduleDate { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
    }
}
