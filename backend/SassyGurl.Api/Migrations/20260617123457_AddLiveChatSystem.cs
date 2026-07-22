using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SassyGurl.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddLiveChatSystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_PushSubscriptions",
                table: "PushSubscriptions");

            migrationBuilder.RenameTable(
                name: "PushSubscriptions",
                newName: "PushSubscription");

            migrationBuilder.AddPrimaryKey(
                name: "PK_PushSubscription",
                table: "PushSubscription",
                column: "id");

            migrationBuilder.CreateTable(
                name: "ChatSession",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    userId = table.Column<string>(type: "text", nullable: true),
                    guestName = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    lastUpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatSession", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "ChatMessage",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    chatSessionId = table.Column<string>(type: "text", nullable: false),
                    senderRole = table.Column<string>(type: "text", nullable: false),
                    messageText = table.Column<string>(type: "text", nullable: false),
                    isRead = table.Column<bool>(type: "boolean", nullable: false),
                    timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatMessage", x => x.id);
                    table.ForeignKey(
                        name: "FK_ChatMessage_ChatSession_chatSessionId",
                        column: x => x.chatSessionId,
                        principalTable: "ChatSession",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ChatMessage_chatSessionId",
                table: "ChatMessage",
                column: "chatSessionId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ChatMessage");

            migrationBuilder.DropTable(
                name: "ChatSession");

            migrationBuilder.DropPrimaryKey(
                name: "PK_PushSubscription",
                table: "PushSubscription");

            migrationBuilder.RenameTable(
                name: "PushSubscription",
                newName: "PushSubscriptions");

            migrationBuilder.AddPrimaryKey(
                name: "PK_PushSubscriptions",
                table: "PushSubscriptions",
                column: "id");
        }
    }
}
