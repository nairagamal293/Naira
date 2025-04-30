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

        // Helper method to check if schedule exists
        private bool ScheduleExists(int id)
        {
            return _context.Schedules.Any(e => e.Id == id);
        }

        // ✅ Get all schedules
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetSchedules()
        {
            var schedules = await _context.Schedules
                .Include(s => s.Class)
                    .ThenInclude(c => c.Trainer)
                .ToListAsync();

            // In your GetSchedules method
            var result = schedules.Select(s => new
            {
                s.Id,
                s.ScheduleDate,
                StartTime = s.StartTime.ToString(), // This will output "hh:mm:ss"
                EndTime = s.EndTime.ToString(),     // This will output "hh:mm:ss"
                ClassName = s.Class?.Name,
                TrainerName = s.Class?.Trainer?.Name
            });

            return Ok(result);
        }

        // ✅ Get schedule by ID
        // ✅ Get schedule by ID
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetSchedule(int id)
        {
            var schedule = await _context.Schedules
                .Include(s => s.Class)
                    .ThenInclude(c => c.Trainer)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (schedule == null)
            {
                return NotFound();
            }

            return new
            {
                schedule.Id,
                schedule.ScheduleDate,
                StartTime = schedule.StartTime.ToString(@"hh\:mm"), // Return as "hh:mm" string
                EndTime = schedule.EndTime.ToString(@"hh\:mm"),     // Return as "hh:mm" string
                ClassName = schedule.Class?.Name,
                TrainerName = schedule.Class?.Trainer?.Name,
                ClassId = schedule.ClassId
            };
        }

        // ✅ Create a schedule (Admin Only)
        // In ScheduleController.cs

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<Schedule>> CreateSchedule(ScheduleCreateDto scheduleDto)
        {
            // Validate the class exists
            var classExists = await _context.Classes.AnyAsync(c => c.Id == scheduleDto.ClassId);
            if (!classExists)
            {
                return BadRequest("Invalid ClassId");
            }

            var schedule = new Schedule
            {
                ClassId = scheduleDto.ClassId,
                ScheduleDate = scheduleDto.ScheduleDate,
                StartTime = scheduleDto.StartTime,
                EndTime = scheduleDto.EndTime
            };

            _context.Schedules.Add(schedule);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetSchedule), new { id = schedule.Id }, schedule);
        }

        // Add this DTO to your project
       

        // ✅ Update a schedule (Admin Only)
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateSchedule(int id, ScheduleUpdateDto scheduleUpdate)
        {
            if (id != scheduleUpdate.Id)
            {
                return BadRequest();
            }

            var schedule = await _context.Schedules.FindAsync(id);
            if (schedule == null)
            {
                return NotFound();
            }

            // Only update the fields we want to allow updating
            schedule.ClassId = scheduleUpdate.ClassId;
            schedule.ScheduleDate = scheduleUpdate.ScheduleDate;
            schedule.StartTime = scheduleUpdate.StartTime;
            schedule.EndTime = scheduleUpdate.EndTime;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ScheduleExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // ✅ Delete a schedule (Admin Only)
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteSchedule(int id)
        {
            var schedule = await _context.Schedules.FindAsync(id);
            if (schedule == null)
            {
                return NotFound();
            }

            _context.Schedules.Remove(schedule);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }

    public class ScheduleUpdateDto
    {
        public int Id { get; set; }
        public int ClassId { get; set; }
        public DateTime ScheduleDate { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
    }
}