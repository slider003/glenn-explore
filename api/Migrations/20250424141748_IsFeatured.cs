using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Api.Features.Migrations
{
    /// <inheritdoc />
    public partial class IsFeatured : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CreatedById",
                table: "Models",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "IsFeatured",
                table: "Models",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreatedById",
                table: "Models");

            migrationBuilder.DropColumn(
                name: "IsFeatured",
                table: "Models");
        }
    }
}
