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

        // ✅ Allow public access to get all classes
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
                    c.Date,
                    StartTime = DateTime.Today.Add(c.StartTime).ToString("hh:mm tt"),
                    EndTime = DateTime.Today.Add(c.EndTime).ToString("hh:mm tt"),
                    c.DaysOfWeek,
                    TrainerName = c.Trainer.Name,
                    c.Price
                })
                .ToListAsync();

            return Ok(classes);
        }

        // ✅ Allow public access to get a single class by ID
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
                Date = classModel.Date?.ToString("yyyy-MM-dd"),
                StartTime = classModel.StartTime.ToString(@"hh\:mm\:ss"),
                EndTime = classModel.EndTime.ToString(@"hh\:mm\:ss"),
                classModel.DaysOfWeek,
                TrainerName = classModel.Trainer?.Name,
                TrainerId = classModel.Trainer?.Id,
                classModel.Price
            };

            return Ok(result);
        }

        // ✅ Protected - requires authentication
        [HttpPost]
        public async Task<IActionResult> CreateClass([FromBody] ClassFormModel classModel)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var newClass = new Class
            {
                Name = classModel.Name,
                Description = classModel.Description,
                Capacity = classModel.Capacity,
                DaysOfWeek = classModel.DaysOfWeek,
                StartTime = TimeSpan.Parse(classModel.StartTime),
                EndTime = TimeSpan.Parse(classModel.EndTime),
                Price = classModel.Price,
                TrainerId = classModel.TrainerId,
                Date = classModel.Date,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Classes.Add(newClass);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetClass), new { id = newClass.Id }, newClass);
        }

        // ✅ Protected - requires authentication
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateClass(int id, [FromBody] ClassFormModel updatedClass)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var existingClass = await _context.Classes.FindAsync(id);
            if (existingClass == null) return NotFound();

            existingClass.Name = updatedClass.Name;
            existingClass.Description = updatedClass.Description;
            existingClass.Capacity = updatedClass.Capacity;
            existingClass.DaysOfWeek = updatedClass.DaysOfWeek;
            existingClass.StartTime = TimeSpan.Parse(updatedClass.StartTime);
            existingClass.EndTime = TimeSpan.Parse(updatedClass.EndTime);
            existingClass.Price = updatedClass.Price;
            existingClass.TrainerId = updatedClass.TrainerId;
            existingClass.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // ✅ Protected - requires authentication
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteClass(int id)
        {
            var classModel = await _context.Classes.FindAsync(id);
            if (classModel == null) return NotFound();

            _context.Classes.Remove(classModel);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // ✅ Form model used for creation and updates
        public class ClassFormModel
        {
            [Required]
            [StringLength(100)]
            public string Name { get; set; }

            public string Description { get; set; }

            [Required]
            [Range(1, 100)]
            public int Capacity { get; set; }

            public string DaysOfWeek { get; set; }

            [Required]
            [RegularExpression(@"^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$",
                ErrorMessage = "Time must be in HH:mm:ss format")]
            public string StartTime { get; set; }

            [Required]
            [RegularExpression(@"^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$",
                ErrorMessage = "Time must be in HH:mm:ss format")]
            public string EndTime { get; set; }

            [Required]
            [Range(0, 1000)]
            public decimal Price { get; set; }

            [Required]
            public int TrainerId { get; set; }

            public DateTime? Date { get; set; }
        }
    }
}
