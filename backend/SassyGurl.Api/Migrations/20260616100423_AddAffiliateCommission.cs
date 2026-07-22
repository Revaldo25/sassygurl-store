using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SassyGurl.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAffiliateCommission : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "affiliateUserId",
                table: "Transaction",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "AffiliateCommission",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    affiliateUserId = table.Column<string>(type: "text", nullable: false),
                    transactionId = table.Column<string>(type: "text", nullable: false),
                    amount = table.Column<decimal>(type: "numeric(15,2)", nullable: false),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AffiliateCommission", x => x.id);
                    table.ForeignKey(
                        name: "FK_AffiliateCommission_Transaction_transactionId",
                        column: x => x.transactionId,
                        principalTable: "Transaction",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AffiliateCommission_User_affiliateUserId",
                        column: x => x.affiliateUserId,
                        principalTable: "User",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Transaction_affiliateUserId",
                table: "Transaction",
                column: "affiliateUserId");

            migrationBuilder.CreateIndex(
                name: "IX_AffiliateCommission_affiliateUserId",
                table: "AffiliateCommission",
                column: "affiliateUserId");

            migrationBuilder.CreateIndex(
                name: "IX_AffiliateCommission_transactionId",
                table: "AffiliateCommission",
                column: "transactionId");

            migrationBuilder.AddForeignKey(
                name: "FK_Transaction_User_affiliateUserId",
                table: "Transaction",
                column: "affiliateUserId",
                principalTable: "User",
                principalColumn: "id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Transaction_User_affiliateUserId",
                table: "Transaction");

            migrationBuilder.DropTable(
                name: "AffiliateCommission");

            migrationBuilder.DropIndex(
                name: "IX_Transaction_affiliateUserId",
                table: "Transaction");

            migrationBuilder.DropColumn(
                name: "affiliateUserId",
                table: "Transaction");
        }
    }
}
