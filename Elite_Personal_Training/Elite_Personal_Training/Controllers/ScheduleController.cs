using Elite_Personal_Training.Data;
using Elite_Personal_Training.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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

        // ✅ Get all schedules
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetSchedules()
        {
            var schedules = await _context.Schedules
                .Include(s => s.Class)
                    .ThenInclude(c => c.Trainer)
                .ToListAsync();

            var result = schedules.Select(s => new
            {
                s.Id,
                s.ScheduleDate,
                StartTime = DateTime.Today.Add(s.StartTime).ToString("hh:mm tt"), // ✅ Fixed
                EndTime = DateTime.Today.Add(s.EndTime).ToString("hh:mm tt"), // ✅ Fixed
                ClassName = s.Class?.Name,
                TrainerName = s.Class?.Trainer?.Name
            });

            return Ok(result); // ✅ Clean JSON, avoids cycles
        }




        // ✅ Get schedule by ID
        [HttpGet("{id}")]
        public async Task<ActionResult<Schedule>> GetSchedule(int id)
        {
            var schedule = await _context.Schedules.Include(s => s.Class).FirstOrDefaultAsync(s => s.Id == id);
            if (schedule == null)
            {
                return NotFound();
            }
            return schedule;
        }

        // ✅ Create a schedule (Admin Only)
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<Schedule>> CreateSchedule(Schedule schedule)
        {
            _context.Schedules.Add(schedule);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetSchedule), new { id = schedule.Id }, schedule);
        }

        // ✅ Update a schedule (Admin Only)
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateSchedule(int id, Schedule schedule)
        {
            if (id != schedule.Id)
            {
                return BadRequest();
            }

            _context.Entry(schedule).State = EntityState.Modified;
            await _context.SaveChangesAsync();

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
}
