using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SassyGurl.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCleanNameAndMargin : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "cleanName",
                table: "Product",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "margin",
                table: "Product",
                type: "numeric(10,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "originalName",
                table: "Product",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "currencyName",
                table: "Game",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "cleanName",
                table: "Product");

            migrationBuilder.DropColumn(
                name: "margin",
                table: "Product");

            migrationBuilder.DropColumn(
                name: "originalName",
                table: "Product");

            migrationBuilder.DropColumn(
                name: "currencyName",
                table: "Game");
        }
    }
}
