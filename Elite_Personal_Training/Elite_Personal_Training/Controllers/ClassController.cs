using Elite_Personal_Training.Data;
using Elite_Personal_Training.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.ComponentModel.DataAnnotations;

namespace Elite_Personal_Training.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ClassController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ClassController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetClasses()
        {
            var classes = await _context.Classes
                .Include(c => c.Trainer)
                .Select(c => new
                {
                    c.Id,
                    c.Name,
                    c.Description,
                    c.Capacity,
                    DurationInMinutes = (int)c.Duration.TotalMinutes,
                    TrainerName = c.Trainer.Name,
                    c.Price
                })
                .ToListAsync();

            return Ok(classes);
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetClass(int id)
        {
            var classModel = await _context.Classes
                .Include(c => c.Trainer)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (classModel == null)
                return NotFound();

            var result = new
            {
                classModel.Id,
                classModel.Name,
                classModel.Description,
                classModel.Capacity,
                DurationInMinutes = (int)classModel.Duration.TotalMinutes,
                TrainerName = classModel.Trainer?.Name,
                TrainerId = classModel.Trainer?.Id,
                classModel.Price
            };

            return Ok(result);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateClass([FromBody] ClassFormModel classModel)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var newClass = new Class
            {
                Name = classModel.Name,
                Description = classModel.Description,
                Capacity = classModel.Capacity,
                Duration = TimeSpan.FromMinutes(classModel.DurationInMinutes),
                Price = classModel.Price,
                TrainerId = classModel.TrainerId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Classes.Add(newClass);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetClass), new { id = newClass.Id }, newClass);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateClass(int id, [FromBody] ClassFormModel updatedClass)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var existingClass = await _context.Classes.FindAsync(id);
            if (existingClass == null) return NotFound();

            existingClass.Name = updatedClass.Name;
            existingClass.Description = updatedClass.Description;
            existingClass.Capacity = updatedClass.Capacity;
            existingClass.Duration = TimeSpan.FromMinutes(updatedClass.DurationInMinutes);
            existingClass.Price = updatedClass.Price;
            existingClass.TrainerId = updatedClass.TrainerId;
            existingClass.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteClass(int id)
        {
            var classModel = await _context.Classes.FindAsync(id);
            if (classModel == null) return NotFound();

            _context.Classes.Remove(classModel);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        public class ClassFormModel
        {
            [Required]
            [StringLength(100)]
            public string Name { get; set; }

            public string? Description { get; set; }

            [Required]
            [Range(1, 100)]
            public int Capacity { get; set; }

            [Required]
            [Range(1, 480)] // Max 8 hours
            public int DurationInMinutes { get; set; }

            [Required]
            [Range(0, 1000)]
            public decimal Price { get; set; }

            [Required]
            public int TrainerId { get; set; }
        }
    }
}