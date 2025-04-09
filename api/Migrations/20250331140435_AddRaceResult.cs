using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Api.Features.Migrations
{
    /// <inheritdoc />
    public partial class AddRaceResult : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RaceResults",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    PlayerId = table.Column<string>(type: "TEXT", nullable: false),
                    PlayerName = table.Column<string>(type: "TEXT", nullable: false),
                    TrackId = table.Column<string>(type: "TEXT", nullable: false),
                    Time = table.Column<double>(type: "REAL", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RaceResults", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RaceResults_Players_PlayerId",
                        column: x => x.PlayerId,
                        principalTable: "Players",
                        principalColumn: "PlayerId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RaceResults_CompletedAt",
                table: "RaceResults",
                column: "CompletedAt");

            migrationBuilder.CreateIndex(
                name: "IX_RaceResults_PlayerId",
                table: "RaceResults",
                column: "PlayerId");

            migrationBuilder.CreateIndex(
                name: "IX_RaceResults_PlayerId_TrackId_Time",
                table: "RaceResults",
                columns: new[] { "PlayerId", "TrackId", "Time" });

            migrationBuilder.CreateIndex(
                name: "IX_RaceResults_TrackId",
                table: "RaceResults",
                column: "TrackId");

            migrationBuilder.CreateIndex(
                name: "IX_RaceResults_TrackId_Time",
                table: "RaceResults",
                columns: new[] { "TrackId", "Time" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RaceResults");
        }
    }
}
