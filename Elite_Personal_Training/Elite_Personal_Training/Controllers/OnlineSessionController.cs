using Elite_Personal_Training.Data;
using Elite_Personal_Training.DTOs;
using Elite_Personal_Training.Models;
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
    public class OnlineSessionController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public OnlineSessionController(ApplicationDbContext context)
        {
            _context = context;
        }

        // ✅ Get all online sessions with Trainer names
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetOnlineSessions()
        {
            var sessions = await _context.OnlineSessions
                .Include(s => s.Trainer)
                .Select(s => new
                {
                    s.Id,
                    s.Title,
                    s.Description,
                    TrainerName = s.Trainer.Name, // Trainer Name
                    s.SessionDateTime,
                    s.MeetingLink,
                    s.Price, // 💰 Include price
                    s.CreatedAt,
                    s.UpdatedAt
                })
                .ToListAsync();

            return Ok(sessions);
        }

        // ✅ Get a single online session by ID
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetOnlineSession(int id)
        {
            var session = await _context.OnlineSessions
                .Include(s => s.Trainer)
                .Where(s => s.Id == id)
                .Select(s => new
                {
                    s.Id,
                    s.Title,
                    s.Description,
                    TrainerName = s.Trainer.Name,
                    s.SessionDateTime,
                    s.MeetingLink,
                    s.Price, // 💰 Include price
                    s.CreatedAt,
                    s.UpdatedAt
                })
                .FirstOrDefaultAsync();

            if (session == null) return NotFound();

            return Ok(session);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateOnlineSession(int id, [FromBody] OnlineSessionUpdateDto updatedSession)
        {
            if (id != updatedSession.Id) return BadRequest("ID mismatch");

            var session = await _context.OnlineSessions.FindAsync(id);
            if (session == null) return NotFound();

            session.Title = updatedSession.Title;
            session.Description = updatedSession.Description;
            session.TrainerId = updatedSession.TrainerId;
            session.SessionDateTime = updatedSession.SessionDateTime;
            session.MeetingLink = updatedSession.MeetingLink;
            session.Price = updatedSession.Price;
            session.UpdatedAt = DateTime.UtcNow;

            try
            {
                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.OnlineSessions.Any(e => e.Id == id))
                {
                    return NotFound();
                }
                throw;
            }
        }

        [HttpPost]
        public async Task<ActionResult<OnlineSession>> CreateOnlineSession([FromBody] OnlineSessionCreateDto newSession)
        {
            var session = new OnlineSession
            {
                Title = newSession.Title,
                Description = newSession.Description,
                TrainerId = newSession.TrainerId,
                SessionDateTime = newSession.SessionDateTime,
                MeetingLink = newSession.MeetingLink,
                Price = newSession.Price,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.OnlineSessions.Add(session);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetOnlineSession), new { id = session.Id }, session);
        }

        // ✅ Delete an online session
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteOnlineSession(int id)
        {
            var session = await _context.OnlineSessions.FindAsync(id);
            if (session == null) return NotFound();

            _context.OnlineSessions.Remove(session);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
