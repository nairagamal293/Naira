namespace Elite_Personal_Training.DTOs
{
    public class ScheduleCreateDto
    {
        public int ClassId { get; set; }
        public int TrainerId { get; set; }
        public DateTime ScheduleDate { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
    }

    public class ScheduleUpdateDto
    {
        public int Id { get; set; }
        public int ClassId { get; set; }
        public int TrainerId { get; set; }  // This is correctly included
        public DateTime ScheduleDate { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
    }
}
