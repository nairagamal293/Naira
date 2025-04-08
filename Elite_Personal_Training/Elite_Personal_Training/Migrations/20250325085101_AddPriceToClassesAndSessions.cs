using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Elite_Personal_Training.Migrations
{
    /// <inheritdoc />
    public partial class AddPriceToClassesAndSessions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "Price",
                table: "OnlineSessions",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Price",
                table: "Classes",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Price",
                table: "OnlineSessions");

            migrationBuilder.DropColumn(
                name: "Price",
                table: "Classes");
        }
    }
}
