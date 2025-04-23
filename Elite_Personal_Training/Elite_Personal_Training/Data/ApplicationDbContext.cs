using Elite_Personal_Training.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Elite_Personal_Training.Data
{
    public class ApplicationDbContext : IdentityDbContext<User, IdentityRole<Guid>, Guid>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        // Parameterless constructor for design-time migrations
        public ApplicationDbContext()
        {
        }

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

            // Configure User entity with GUID primary key
            modelBuilder.Entity<User>(entity =>
            {
                entity.Property(e => e.Id)
                    .ValueGeneratedOnAdd()
                    .HasConversion(
                        v => v.ToString(),
                        v => Guid.Parse(v));
            });

            // Configure decimal precision for monetary values
            modelBuilder.Entity<Booking>()
                .Property(b => b.Price)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<Class>()
                .Property(c => c.Price)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<OnlineSession>()
                .Property(o => o.Price)
                .HasColumnType("decimal(18,2)");

            // Configure relationship between Payment and Booking
            modelBuilder.Entity<Payment>()
                .HasOne(p => p.Booking)
                .WithMany(b => b.Payments)
                .HasForeignKey(p => p.BookingId)
                .OnDelete(DeleteBehavior.NoAction);

            // Configure relationship between Booking and User with GUID conversion
            modelBuilder.Entity<Booking>()
                .Property(b => b.UserId)
                .HasConversion(
                    v => v.ToString(),
                    v => Guid.Parse(v));

            modelBuilder.Entity<Booking>()
                .HasOne(b => b.User)
                .WithMany(u => u.Bookings)
                .HasForeignKey(b => b.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure relationship between SessionBooking and User with GUID conversion
            modelBuilder.Entity<SessionBooking>()
                .Property(sb => sb.UserId)
                .HasConversion(
                    v => v.ToString(),
                    v => Guid.Parse(v));

            modelBuilder.Entity<SessionBooking>()
                .HasOne(sb => sb.User)
                .WithMany(u => u.SessionBookings)
                .HasForeignKey(sb => sb.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Identity GUID configuration — NO additional conversions
            modelBuilder.Entity<IdentityRole<Guid>>()
                .Property(r => r.Id)
                .ValueGeneratedOnAdd();
        }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
            {
                optionsBuilder.UseSqlServer("Server=.\\SQLEXPRESS;Database=EliteStudio;Trusted_Connection=True;TrustServerCertificate=True;",
                    sqlOptions =>
                    {
                        sqlOptions.MigrationsHistoryTable("__EFMigrationsHistory");
                        sqlOptions.EnableRetryOnFailure(
                            maxRetryCount: 5,
                            maxRetryDelay: TimeSpan.FromSeconds(30),
                            errorNumbersToAdd: null);
                    });
            }
        }
    }
}
