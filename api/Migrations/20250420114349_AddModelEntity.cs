using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Api.Features.Migrations
{
    /// <inheritdoc />
    public partial class AddModelEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // First delete all records from UnlockedModels
            migrationBuilder.Sql("DELETE FROM UnlockedModels");

            // Create Models table
            migrationBuilder.CreateTable(
                name: "Models",
                columns: table => new
                {
                    ModelId = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 255, nullable: false),
                    Type = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    ConfigJson = table.Column<string>(type: "TEXT", nullable: false),
                    IsPremium = table.Column<bool>(type: "INTEGER", nullable: false),
                    Price = table.Column<decimal>(type: "TEXT", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ThumbnailFileId = table.Column<string>(type: "TEXT", nullable: true),
                    ModelFileId = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Models", x => x.ModelId);
                    table.ForeignKey(
                        name: "FK_Models_Files_ModelFileId",
                        column: x => x.ModelFileId,
                        principalTable: "Files",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Models_Files_ThumbnailFileId",
                        column: x => x.ThumbnailFileId,
                        principalTable: "Files",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            // Add index for ModelId on UnlockedModels
            migrationBuilder.CreateIndex(
                name: "IX_UnlockedModels_ModelId",
                table: "UnlockedModels",
                column: "ModelId");

            // Add other indexes for Models table
            migrationBuilder.CreateIndex(
                name: "IX_Models_IsActive",
                table: "Models",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_Models_IsPremium",
                table: "Models",
                column: "IsPremium");

            migrationBuilder.CreateIndex(
                name: "IX_Models_ModelFileId",
                table: "Models",
                column: "ModelFileId");

            migrationBuilder.CreateIndex(
                name: "IX_Models_ThumbnailFileId",
                table: "Models",
                column: "ThumbnailFileId");

            migrationBuilder.CreateIndex(
                name: "IX_Models_Type",
                table: "Models",
                column: "Type");

            // Add foreign key from UnlockedModels to Models
            migrationBuilder.AddForeignKey(
                name: "FK_UnlockedModels_Models_ModelId",
                table: "UnlockedModels",
                column: "ModelId",
                principalTable: "Models",
                principalColumn: "ModelId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Remove the foreign key first
            migrationBuilder.DropForeignKey(
                name: "FK_UnlockedModels_Models_ModelId",
                table: "UnlockedModels");

            // Remove the ModelId index
            migrationBuilder.DropIndex(
                name: "IX_UnlockedModels_ModelId",
                table: "UnlockedModels");

            // Drop the Models table
            migrationBuilder.DropTable(
                name: "Models");
        }
    }
}
