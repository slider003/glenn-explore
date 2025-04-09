using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Api.Features.Migrations
{
    /// <inheritdoc />
    public partial class PlayerStateChange : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MovementState",
                table: "Players");

            migrationBuilder.DropColumn(
                name: "VehicleEnteredAt",
                table: "Players");

            migrationBuilder.DropColumn(
                name: "VehicleId",
                table: "Players");

            migrationBuilder.DropColumn(
                name: "VehicleRole",
                table: "Players");

            migrationBuilder.DropColumn(
                name: "PlayerMovementState",
                table: "Messages");

            migrationBuilder.DropColumn(
                name: "PlayerVehicleId",
                table: "Messages");

            migrationBuilder.AddColumn<string>(
                name: "AnimationState",
                table: "Players",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ModelType",
                table: "Players",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "StateType",
                table: "Players",
                type: "TEXT",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AnimationState",
                table: "Players");

            migrationBuilder.DropColumn(
                name: "ModelType",
                table: "Players");

            migrationBuilder.DropColumn(
                name: "StateType",
                table: "Players");

            migrationBuilder.AddColumn<int>(
                name: "MovementState",
                table: "Players",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "VehicleEnteredAt",
                table: "Players",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VehicleId",
                table: "Players",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "VehicleRole",
                table: "Players",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "PlayerMovementState",
                table: "Messages",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PlayerVehicleId",
                table: "Messages",
                type: "TEXT",
                nullable: true);
        }
    }
}
