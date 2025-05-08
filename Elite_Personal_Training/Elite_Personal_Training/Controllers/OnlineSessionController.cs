using Elite_Personal_Training.Data;
using Elite_Personal_Training.DTOs;
using Elite_Personal_Training.Models;
using Elite_Personal_Training.Services;
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
        private readonly IZoomService _zoomService;
        private readonly ILogger<OnlineSessionController> _logger;


        public OnlineSessionController(ApplicationDbContext context, IZoomService zoomService, ILogger<OnlineSessionController> logger)
        {
            _context = context;
            _zoomService = zoomService;
            _logger = logger;
        }


        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetOnlineSessions()
        {
            return await _context.OnlineSessions
                .Include(s => s.Trainer)
                .Select(s => new
                {
                    s.Id,
                    s.Title,
                    s.Description,
                    TrainerName = s.Trainer.Name,
                    s.SessionDateTime,
                    s.MeetingLink,
                    s.SessionType,
                    s.Capacity,
                    s.Price,
                    BookedCount = _context.Bookings
                        .Count(b => b.OnlineSessionId == s.Id && b.Status != "Cancelled"),
                    s.ZoomMeetingCreated,
                    s.CreatedAt,
                    s.UpdatedAt
                })
                .ToListAsync();
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
                    s.SessionType,
                    s.Capacity,
                    s.Price,
                    s.CreatedAt,
                    s.UpdatedAt
                })
                .FirstOrDefaultAsync();

            if (session == null) return NotFound();

            return Ok(session);
        }

        // ✅ Update online session
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
            session.SessionType = (OnlineSessionType)updatedSession.SessionType;
            session.Capacity = updatedSession.Capacity;
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
                    return NotFound();
                throw;
            }
        }

        // ✅ Create new online session (with Zoom)
        [HttpPost]
        public async Task<ActionResult<OnlineSession>> CreateOnlineSession([FromBody] OnlineSessionCreateDto newSession)
        {
            try
            {
                var session = new OnlineSession
                {
                    Title = newSession.Title,
                    Description = newSession.Description,
                    TrainerId = newSession.TrainerId,
                    SessionDateTime = newSession.SessionDateTime,
                    SessionType = (OnlineSessionType)newSession.SessionType,
                    Capacity = newSession.Capacity,
                    Price = newSession.Price,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                // 🔗 Generate Zoom link
                try
                {
                    session.MeetingLink = await _zoomService.CreateMeetingAsync(session);
                    session.ZoomMeetingCreated = true;
                }
                catch (Exception ex)
                {
                    // Log zoom error but continue
                    _logger.LogError(ex, "Error creating Zoom meeting");
                    session.MeetingLink = "Zoom link to be generated";
                    session.ZoomMeetingCreated = false;
                }

                _context.OnlineSessions.Add(session);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetOnlineSession), new { id = session.Id }, session);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating online session");
                return StatusCode(500, new
                {
                    Title = "Error creating session",
                    Message = ex.Message,
                    Details = ex.InnerException?.Message
                });
            }
        }

        // ✅ Delete session
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
