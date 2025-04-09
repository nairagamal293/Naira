using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Elite_Personal_Training.Migrations
{
    /// <inheritdoc />
    public partial class AddBookingDateToBookings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "BookingDate",
                table: "Bookings",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(2000, 1, 1)); // Set a sensible default
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BookingDate",
                table: "Bookings");
        }
    }
}
