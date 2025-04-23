using Elite_Personal_Training.Data;
using Elite_Personal_Training.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Elite_Personal_Training.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MembershipController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public MembershipController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Membership
        [HttpGet]
        public async Task<IActionResult> GetMemberships()
        {
            var memberships = await _context.Memberships.ToListAsync();
            return Ok(memberships);
        }

        // GET: api/Membership/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetMembership(int id)
        {
            var membership = await _context.Memberships.FindAsync(id);
            if (membership == null)
                return NotFound();

            return Ok(membership);
        }

        // POST: api/Membership
        [HttpPost]
        public async Task<IActionResult> CreateMembership([FromBody] Membership membership)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            _context.Memberships.Add(membership);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetMembership), new { id = membership.Id }, membership);
        }

        // PUT: api/Membership/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateMembership(int id, [FromBody] Membership updatedMembership)
        {
            if (id != updatedMembership.Id)
                return BadRequest("Membership ID mismatch");

            var existingMembership = await _context.Memberships.FindAsync(id);
            if (existingMembership == null)
                return NotFound();

            // Update fields
            existingMembership.Name = updatedMembership.Name;
            existingMembership.Price = updatedMembership.Price;
            existingMembership.Description = updatedMembership.Description;
            existingMembership.DurationInDays = updatedMembership.DurationInDays;
            existingMembership.StartDate = updatedMembership.StartDate;

            await _context.SaveChangesAsync();
            return Ok(existingMembership);
        }

        // GET: api/Membership/UserMembership/{userId}
        [HttpGet("UserMembership/{userId}")]
        public async Task<IActionResult> GetUserMembership(Guid userId)
        {
            var userMembership = await _context.Bookings
                .Include(b => b.Membership)
                .Where(b => b.UserId == userId && b.MembershipId != null)
                .Select(b => new
                {
                    MembershipName = b.Membership.Name,
                    StartDate = b.Membership.StartDate,
                    ExpiryDate = b.Membership.ExpiryDate,
                    Price = b.Membership.Price,
                    Description = b.Membership.Description
                })
                .FirstOrDefaultAsync();

            if (userMembership == null)
                return NotFound(new { Message = "No active membership found for this user." });

            return Ok(userMembership);
        }


        // DELETE: api/Membership/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMembership(int id)
        {
            var membership = await _context.Memberships.FindAsync(id);
            if (membership == null)
                return NotFound();

            _context.Memberships.Remove(membership);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
