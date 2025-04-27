using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Api.Features.Migrations
{
    /// <inheritdoc />
    public partial class QuestProgress : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "QuestProgress",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    PlayerId = table.Column<string>(type: "TEXT", nullable: false),
                    QuestId = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Progress = table.Column<int>(type: "INTEGER", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    PlayerId1 = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuestProgress", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QuestProgress_Players_PlayerId",
                        column: x => x.PlayerId,
                        principalTable: "Players",
                        principalColumn: "PlayerId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_QuestProgress_Players_PlayerId1",
                        column: x => x.PlayerId1,
                        principalTable: "Players",
                        principalColumn: "PlayerId");
                });

            migrationBuilder.CreateIndex(
                name: "IX_QuestProgress_PlayerId",
                table: "QuestProgress",
                column: "PlayerId");

            migrationBuilder.CreateIndex(
                name: "IX_QuestProgress_PlayerId_QuestId",
                table: "QuestProgress",
                columns: new[] { "PlayerId", "QuestId" });

            migrationBuilder.CreateIndex(
                name: "IX_QuestProgress_PlayerId1",
                table: "QuestProgress",
                column: "PlayerId1");

            migrationBuilder.CreateIndex(
                name: "IX_QuestProgress_UpdatedAt",
                table: "QuestProgress",
                column: "UpdatedAt");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "QuestProgress");
        }
    }
}
