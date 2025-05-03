using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Elite_Personal_Training.Migrations
{
    /// <inheritdoc />
    public partial class RemoveTrainerFromClassAddToSchedule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Classes_Trainers_TrainerId",
                table: "Classes");

            migrationBuilder.AddColumn<int>(
                name: "TrainerId",
                table: "Schedules",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AlterColumn<int>(
                name: "TrainerId",
                table: "Classes",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.CreateIndex(
                name: "IX_Schedules_TrainerId",
                table: "Schedules",
                column: "TrainerId");

            migrationBuilder.AddForeignKey(
                name: "FK_Classes_Trainers_TrainerId",
                table: "Classes",
                column: "TrainerId",
                principalTable: "Trainers",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Schedules_Trainers_TrainerId",
                table: "Schedules",
                column: "TrainerId",
                principalTable: "Trainers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Classes_Trainers_TrainerId",
                table: "Classes");

            migrationBuilder.DropForeignKey(
                name: "FK_Schedules_Trainers_TrainerId",
                table: "Schedules");

            migrationBuilder.DropIndex(
                name: "IX_Schedules_TrainerId",
                table: "Schedules");

            migrationBuilder.DropColumn(
                name: "TrainerId",
                table: "Schedules");

            migrationBuilder.AlterColumn<int>(
                name: "TrainerId",
                table: "Classes",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Classes_Trainers_TrainerId",
                table: "Classes",
                column: "TrainerId",
                principalTable: "Trainers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
