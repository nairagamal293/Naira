using Elite_Personal_Training.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Elite_Personal_Training.Data
{
    public class ApplicationDbContext : IdentityDbContext<User>
    {
       public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
           : base(options)
        {
        }

        // Add this parameterless constructor for design-time migrations
        

        public DbSet<Membership> Memberships { get; set; }
        public DbSet<Class> Classes { get; set; }
        public DbSet<Booking> Bookings { get; set; }
        public DbSet<OnlineSession> OnlineSessions { get; set; }
        public DbSet<SessionBooking> SessionBookings { get; set; }
        public DbSet<Contact> Contacts { get; set; }
        public DbSet<Schedule> Schedules { get; set; }
        public DbSet<Trainer> Trainers { get; set; }
        public DbSet<Payment> Payments { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ✅ Ensure the decimal fields have correct precision
            modelBuilder.Entity<Booking>()
                .Property(b => b.Price)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<Class>()
                .Property(c => c.Price)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<OnlineSession>()
                .Property(o => o.Price)
                .HasColumnType("decimal(18,2)");

            // ✅ Prevent cascade delete on Payment -> Booking
            modelBuilder.Entity<Payment>()
                .HasOne(p => p.Booking)
                .WithMany(b => b.Payments)
                .HasForeignKey(p => p.BookingId)
                .OnDelete(DeleteBehavior.NoAction);
        }



        // Add the OnConfiguring method here
        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
            {
                // This is only used for migrations if not configured via DI
                optionsBuilder.UseSqlServer("Server=.\\SQLEXPRESS;Database=EliteStudio;Trusted_Connection=True;TrustServerCertificate=True;");
            }
        }

    }
}