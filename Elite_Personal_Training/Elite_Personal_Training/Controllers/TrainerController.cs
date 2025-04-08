using Elite_Personal_Training.Data;
using Elite_Personal_Training.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace Elite_Personal_Training.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TrainerController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public TrainerController(ApplicationDbContext context)
        {
            _context = context;
        }

        // ✅ Get all trainers
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetTrainers()
        {
            var trainers = await _context.Trainers.ToListAsync();

            return Ok(trainers.Select(t => new
            {
                t.Id,
                t.Name,
                t.Description,
                Image = t.Image != null ? Convert.ToBase64String(t.Image) : null, // Convert image to Base64
                t.SnapchatUrl,
                t.InstagramUrl,
                t.TwitterUrl,
                t.CreatedAt,
                t.UpdatedAt
            }));
        }

        // ✅ Get trainer by ID
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetTrainer(int id)
        {
            var trainer = await _context.Trainers.FindAsync(id);
            if (trainer == null)
            {
                return NotFound();
            }

            return Ok(new
            {
                trainer.Id,
                trainer.Name,
                trainer.Description,
                Image = trainer.Image != null ? Convert.ToBase64String(trainer.Image) : null,
                trainer.SnapchatUrl,
                trainer.InstagramUrl,
                trainer.TwitterUrl,
                trainer.CreatedAt,
                trainer.UpdatedAt
            });
        }

        // ✅ Create a new trainer (supports image upload)
        [HttpPost]
        public async Task<ActionResult<Trainer>> CreateTrainer([FromForm] TrainerRequest request)
        {
            var trainer = new Trainer
            {
                Name = request.Name,
                Description = request.Description,
                SnapchatUrl = request.SnapchatUrl,
                InstagramUrl = request.InstagramUrl,
                TwitterUrl = request.TwitterUrl,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // Handle image upload
            if (request.ImageFile != null)
            {
                using var memoryStream = new MemoryStream();
                await request.ImageFile.CopyToAsync(memoryStream);
                trainer.Image = memoryStream.ToArray();
            }

            _context.Trainers.Add(trainer);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetTrainer), new { id = trainer.Id }, trainer);
        }

        // ✅ Update an existing trainer
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTrainer(int id, [FromForm] TrainerRequest request)
        {
            var trainer = await _context.Trainers.FindAsync(id);
            if (trainer == null)
            {
                return NotFound();
            }

            trainer.Name = request.Name;
            trainer.Description = request.Description;
            trainer.SnapchatUrl = request.SnapchatUrl;
            trainer.InstagramUrl = request.InstagramUrl;
            trainer.TwitterUrl = request.TwitterUrl;
            trainer.UpdatedAt = DateTime.UtcNow;

            // Handle image update (if new image is uploaded)
            if (request.ImageFile != null)
            {
                using var memoryStream = new MemoryStream();
                await request.ImageFile.CopyToAsync(memoryStream);
                trainer.Image = memoryStream.ToArray();
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // ✅ Delete trainer
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTrainer(int id)
        {
            var trainer = await _context.Trainers.FindAsync(id);
            if (trainer == null)
            {
                return NotFound();
            }

            _context.Trainers.Remove(trainer);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }

    // ✅ Request model for handling form-data (image upload)
    public class TrainerRequest
    {
        public string Name { get; set; }
        public string? Description { get; set; }
        public IFormFile? ImageFile { get; set; } // Handle file upload
        public string? SnapchatUrl { get; set; }
        public string? InstagramUrl { get; set; }
        public string? TwitterUrl { get; set; }
    }
}
