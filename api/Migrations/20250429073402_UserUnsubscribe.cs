using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Api.Features.Migrations
{
    /// <inheritdoc />
    public partial class UserUnsubscribe : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsSubscribedToEmails",
                table: "AspNetUsers",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsSubscribedToEmails",
                table: "AspNetUsers");
        }
    }
}
