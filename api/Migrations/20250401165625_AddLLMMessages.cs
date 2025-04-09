using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Api.Features.Migrations
{
    /// <inheritdoc />
    public partial class AddLLMMessages : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "LLMMessages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    ConversationId = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Role = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    Content = table.Column<string>(type: "TEXT", nullable: false),
                    ToolName = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    ToolResponse = table.Column<string>(type: "TEXT", nullable: true),
                    SentAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LLMMessages", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LLMMessages_ConversationId_SentAt",
                table: "LLMMessages",
                columns: new[] { "ConversationId", "SentAt" });

            migrationBuilder.CreateIndex(
                name: "IX_LLMMessages_Role_SentAt",
                table: "LLMMessages",
                columns: new[] { "Role", "SentAt" });

            migrationBuilder.CreateIndex(
                name: "IX_LLMMessages_SentAt",
                table: "LLMMessages",
                column: "SentAt");

            migrationBuilder.CreateIndex(
                name: "IX_LLMMessages_ToolName",
                table: "LLMMessages",
                column: "ToolName");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LLMMessages");
        }
    }
}
