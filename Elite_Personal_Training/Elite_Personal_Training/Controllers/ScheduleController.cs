using Elite_Personal_Training.Data;
using Elite_Personal_Training.DTOs;
using Elite_Personal_Training.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Elite_Personal_Training.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ScheduleController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ScheduleController(ApplicationDbContext context)
        {
            _context = context;
        }

        private bool ScheduleExists(int id) => _context.Schedules.Any(e => e.Id == id);

        private async Task<bool> IsTrainerAvailable(int trainerId, DateTime date, TimeSpan startTime, TimeSpan endTime)
        {
            return !await _context.Schedules.AnyAsync(s =>
                s.TrainerId == trainerId &&
                s.ScheduleDate == date &&
                ((s.StartTime <= startTime && s.EndTime > startTime) ||
                (s.StartTime < endTime && s.EndTime >= endTime) ||
                (s.StartTime >= startTime && s.EndTime <= endTime)));
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetSchedules()
        {
            var schedules = await _context.Schedules
                .Include(s => s.Class)
                .Include(s => s.Trainer)
                .ToListAsync();

            var result = schedules.Select(s => new
            {
                s.Id,
                s.ScheduleDate,
                StartTime = s.StartTime.ToString(),
                EndTime = s.EndTime.ToString(),
                ClassName = s.Class?.Name,
                TrainerName = s.Trainer?.Name
            });

            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetSchedule(int id)
        {
            var schedule = await _context.Schedules
                .Include(s => s.Class)
                .Include(s => s.Trainer)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (schedule == null) return NotFound();

            return new
            {
                schedule.Id,
                schedule.ScheduleDate,
                StartTime = schedule.StartTime.ToString(@"hh\:mm"),
                EndTime = schedule.EndTime.ToString(@"hh\:mm"),
                ClassName = schedule.Class?.Name,
                TrainerName = schedule.Trainer?.Name,
                ClassId = schedule.ClassId,
                TrainerId = schedule.TrainerId
            };
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<Schedule>> CreateSchedule(ScheduleCreateDto scheduleDto)
        {
            if (!await _context.Classes.AnyAsync(c => c.Id == scheduleDto.ClassId))
                return BadRequest("Invalid ClassId");

            if (!await _context.Trainers.AnyAsync(t => t.Id == scheduleDto.TrainerId))
                return BadRequest("Invalid TrainerId");

            if (!await IsTrainerAvailable(scheduleDto.TrainerId, scheduleDto.ScheduleDate,
                                        scheduleDto.StartTime, scheduleDto.EndTime))
                return BadRequest("Trainer is not available");

            var schedule = new Schedule
            {
                ClassId = scheduleDto.ClassId,
                TrainerId = scheduleDto.TrainerId,
                ScheduleDate = scheduleDto.ScheduleDate,
                StartTime = scheduleDto.StartTime,
                EndTime = scheduleDto.EndTime
            };

            _context.Schedules.Add(schedule);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetSchedule), new { id = schedule.Id }, schedule);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateSchedule(int id, ScheduleUpdateDto scheduleUpdate)
        {
            if (id != scheduleUpdate.Id) return BadRequest();

            var schedule = await _context.Schedules.FindAsync(id);
            if (schedule == null) return NotFound();

            if (!await _context.Trainers.AnyAsync(t => t.Id == scheduleUpdate.TrainerId))
                return BadRequest("Invalid TrainerId");

            schedule.ClassId = scheduleUpdate.ClassId;
            schedule.TrainerId = scheduleUpdate.TrainerId;
            schedule.ScheduleDate = scheduleUpdate.ScheduleDate;
            schedule.StartTime = scheduleUpdate.StartTime;
            schedule.EndTime = scheduleUpdate.EndTime;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ScheduleExists(id)) return NotFound();
                throw;
            }

            return NoContent();
        }

        // In your ScheduleController.cs

        [HttpGet("available")]
        public async Task<ActionResult<IEnumerable<ScheduleDto>>> GetAvailableSchedules([FromQuery] int? classId)
        {
            var now = DateTime.UtcNow;

            var query = _context.Schedules
                .Include(s => s.Class)
                .Include(s => s.Trainer)
                .Where(s => s.ScheduleDate > now.Date ||
                           (s.ScheduleDate == now.Date && s.EndTime > now.TimeOfDay));

            if (classId.HasValue)
            {
                query = query.Where(s => s.ClassId == classId.Value);
            }

            var schedules = await query
                .Select(s => new ScheduleDto
                {
                    Id = s.Id,
                    ScheduleDate = s.ScheduleDate,
                    StartTime = s.StartTime.ToString(@"hh\:mm"),
                    EndTime = s.EndTime.ToString(@"hh\:mm"),
                    ClassName = s.Class.Name,
                    TrainerName = s.Trainer.Name,
                    TrainerId = s.Trainer.Id,
                    Price = s.Class.Price,
                    AvailableSpots = s.Class.Capacity - _context.Bookings
                        .Count(b => b.ScheduleId == s.Id && b.Status != "Cancelled")
                })
                .Where(s => s.AvailableSpots > 0)
                .ToListAsync();

            return Ok(schedules);
        }

        

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteSchedule(int id)
        {
            var schedule = await _context.Schedules.FindAsync(id);
            if (schedule == null) return NotFound();

            _context.Schedules.Remove(schedule);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }




    public class ScheduleDto
    {
        public int Id { get; set; }
        public DateTime ScheduleDate { get; set; }
        public string StartTime { get; set; }
        public string EndTime { get; set; }
        public string ClassName { get; set; }
        public string TrainerName { get; set; }
        public int TrainerId { get; set; }
        public decimal Price { get; set; }
        public int AvailableSpots { get; set; }
    }
}