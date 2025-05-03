using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Elite_Personal_Training.Migrations
{
    /// <inheritdoc />
    public partial class UpdateBookingToUseSchedule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Bookings_Classes_ClassId",
                table: "Bookings");

            migrationBuilder.RenameColumn(
                name: "ClassId",
                table: "Bookings",
                newName: "ScheduleId");

            migrationBuilder.RenameIndex(
                name: "IX_Bookings_ClassId",
                table: "Bookings",
                newName: "IX_Bookings_ScheduleId");

            migrationBuilder.AddForeignKey(
                name: "FK_Bookings_Schedules_ScheduleId",
                table: "Bookings",
                column: "ScheduleId",
                principalTable: "Schedules",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Bookings_Schedules_ScheduleId",
                table: "Bookings");

            migrationBuilder.RenameColumn(
                name: "ScheduleId",
                table: "Bookings",
                newName: "ClassId");

            migrationBuilder.RenameIndex(
                name: "IX_Bookings_ScheduleId",
                table: "Bookings",
                newName: "IX_Bookings_ClassId");

            migrationBuilder.AddForeignKey(
                name: "FK_Bookings_Classes_ClassId",
                table: "Bookings",
                column: "ClassId",
                principalTable: "Classes",
                principalColumn: "Id");
        }
    }
}
