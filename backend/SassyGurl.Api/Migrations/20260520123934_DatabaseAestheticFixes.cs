using System;
using Microsoft.EntityFrameworkCore.Migrations;
using SassyGurl.Api.Models.Enums;

#nullable disable

namespace SassyGurl.Api.Migrations
{
    /// <inheritdoc />
    public partial class DatabaseAestheticFixes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Transaction_Game_gameId",
                table: "Transaction");

            migrationBuilder.DropForeignKey(
                name: "FK_Transaction_PaymentMethod_paymentId",
                table: "Transaction");

            migrationBuilder.DropForeignKey(
                name: "FK_Transaction_Product_productId",
                table: "Transaction");

            migrationBuilder.RenameIndex(
                name: "IX_Transaction_promoId",
                table: "Transaction",
                newName: "IX_Transaction_PromoId");

            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:Enum:KycStatus", "BANNED,PENDING,REJECTED,UNVERIFIED,VERIFIED")
                .Annotation("Npgsql:Enum:KycStatus.kyc_status", "unverified,pending,verified,rejected,banned")
                .Annotation("Npgsql:Enum:MutationType", "ADJUSTMENT,COMMISSION,DEPOSIT,PAYMENT,REFUND,WITHDRAWAL")
                .Annotation("Npgsql:Enum:MutationType.mutation_type", "deposit,payment,refund,commission,withdrawal,adjustment")
                .Annotation("Npgsql:Enum:OrderStatus", "CANCELLED,DRAFT,ERROR,FAILED,PARTIAL,PENDING,PROCESSING,REFUNDED,REFUNDING,SUCCESS")
                .Annotation("Npgsql:Enum:OrderStatus.order_status", "draft,pending,processing,success,failed,error,partial,refunding,refunded,cancelled")
                .Annotation("Npgsql:Enum:PaymentStatus", "CHARGEBACK,EXPIRED,FAILED,PAID,PENDING,REFUNDED,UNPAID")
                .Annotation("Npgsql:Enum:PaymentStatus.payment_status", "unpaid,pending,paid,expired,failed,refunded,chargeback")
                .Annotation("Npgsql:Enum:PaymentType", "EWALLET,QRIS,RETAIL,VIRTUAL_ACCOUNT")
                .Annotation("Npgsql:Enum:PaymentType.payment_type", "ewallet,qris,virtual_account,retail")
                .Annotation("Npgsql:Enum:PromoType", "FLAT,PERCENTAGE")
                .Annotation("Npgsql:Enum:PromoType.promo_type", "flat,percentage")
                .Annotation("Npgsql:Enum:ProviderSource", "DIGIFLAZZ,VIP")
                .Annotation("Npgsql:Enum:ProviderSource.provider_source", "vip,digiflazz")
                .Annotation("Npgsql:Enum:Role", "CS,FINANCE,MEMBER,RESELLER,SUPERADMIN,VIP")
                .Annotation("Npgsql:Enum:Role.role", "member,reseller,vip,cs,finance,superadmin")
                .Annotation("Npgsql:Enum:TicketPriority", "HIGH,LOW,MEDIUM,URGENT")
                .Annotation("Npgsql:Enum:TicketPriority.ticket_priority", "low,medium,high,urgent")
                .Annotation("Npgsql:Enum:TicketStatus", "CLOSED,IN_PROGRESS,OPEN,RESOLVED,WAITING_USER")
                .Annotation("Npgsql:Enum:TicketStatus.ticket_status", "open,in_progress,waiting_user,resolved,closed")
                .OldAnnotation("Npgsql:Enum:KycStatus", "BANNED,PENDING,REJECTED,UNVERIFIED,VERIFIED")
                .OldAnnotation("Npgsql:Enum:KycStatus.kyc_status", "unverified,pending,verified,rejected,banned")
                .OldAnnotation("Npgsql:Enum:MutationType", "ADJUSTMENT,COMMISSION,DEPOSIT,PAYMENT,REFUND,WITHDRAWAL")
                .OldAnnotation("Npgsql:Enum:MutationType.mutation_type", "deposit,payment,refund,commission,withdrawal,adjustment")
                .OldAnnotation("Npgsql:Enum:OrderStatus", "ERROR,PARTIAL,PENDING,PROCESSING,REFUNDING,SUCCESS")
                .OldAnnotation("Npgsql:Enum:OrderStatus.order_status", "pending,processing,success,error,partial,refunding")
                .OldAnnotation("Npgsql:Enum:PaymentStatus", "CHARGEBACK,EXPIRED,FAILED,PAID,PENDING,REFUNDED,UNPAID")
                .OldAnnotation("Npgsql:Enum:PaymentStatus.payment_status", "unpaid,pending,paid,expired,failed,refunded,chargeback")
                .OldAnnotation("Npgsql:Enum:PaymentType", "EWALLET,QRIS,RETAIL,VIRTUAL_ACCOUNT")
                .OldAnnotation("Npgsql:Enum:PaymentType.payment_type", "ewallet,qris,virtual_account,retail")
                .OldAnnotation("Npgsql:Enum:PromoType", "FLAT,PERCENTAGE")
                .OldAnnotation("Npgsql:Enum:PromoType.promo_type", "flat,percentage")
                .OldAnnotation("Npgsql:Enum:ProviderSource", "DIGIFLAZZ,VIP")
                .OldAnnotation("Npgsql:Enum:ProviderSource.provider_source", "vip,digiflazz")
                .OldAnnotation("Npgsql:Enum:Role", "CS,FINANCE,MEMBER,RESELLER,SUPERADMIN,VIP")
                .OldAnnotation("Npgsql:Enum:Role.role", "member,reseller,vip,cs,finance,superadmin")
                .OldAnnotation("Npgsql:Enum:TicketPriority", "HIGH,LOW,MEDIUM,URGENT")
                .OldAnnotation("Npgsql:Enum:TicketPriority.ticket_priority", "low,medium,high,urgent")
                .OldAnnotation("Npgsql:Enum:TicketStatus", "CLOSED,IN_PROGRESS,OPEN,RESOLVED,WAITING_USER")
                .OldAnnotation("Npgsql:Enum:TicketStatus.ticket_status", "open,in_progress,waiting_user,resolved,closed");

            migrationBuilder.CreateTable(
                name: "OrderStatusHistory",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    transactionId = table.Column<string>(type: "text", nullable: false),
                    fromStatus = table.Column<OrderStatus>(type: "\"OrderStatus\"", nullable: false),
                    toStatus = table.Column<OrderStatus>(type: "\"OrderStatus\"", nullable: false),
                    changedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    reason = table.Column<string>(type: "text", nullable: true),
                    metadata = table.Column<string>(type: "jsonb", nullable: true),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderStatusHistory", x => x.id);
                    table.ForeignKey(
                        name: "FK_OrderStatusHistory_Transaction_transactionId",
                        column: x => x.transactionId,
                        principalTable: "Transaction",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProviderSyncLog",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    providerName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    operation = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    requestPayload = table.Column<string>(type: "jsonb", nullable: true),
                    responseBody = table.Column<string>(type: "text", nullable: true),
                    httpStatus = table.Column<int>(type: "integer", nullable: false),
                    durationMs = table.Column<int>(type: "integer", nullable: false),
                    itemCount = table.Column<int>(type: "integer", nullable: true),
                    errorCount = table.Column<int>(type: "integer", nullable: false),
                    errorMessage = table.Column<string>(type: "text", nullable: true),
                    traceId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProviderSyncLog", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SystemAudit_EntityId",
                table: "SystemAudit",
                column: "entityId");

            migrationBuilder.CreateIndex(
                name: "IX_AuditableTransaction_OriginalTransactionId",
                table: "AuditableTransaction",
                column: "originalTransactionId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderStatusHistory_CreatedAt",
                table: "OrderStatusHistory",
                column: "createdAt",
                descending: new bool[0]);

            migrationBuilder.CreateIndex(
                name: "IX_OrderStatusHistory_TransactionId",
                table: "OrderStatusHistory",
                column: "transactionId");

            migrationBuilder.CreateIndex(
                name: "IX_ProviderSyncLog_Provider_Date",
                table: "ProviderSyncLog",
                columns: new[] { "providerName", "createdAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ProviderSyncLog_Status",
                table: "ProviderSyncLog",
                column: "httpStatus");

            migrationBuilder.AddForeignKey(
                name: "FK_AuditableTransaction_Transaction_originalTransactionId",
                table: "AuditableTransaction",
                column: "originalTransactionId",
                principalTable: "Transaction",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Transaction_Game_gameId",
                table: "Transaction",
                column: "gameId",
                principalTable: "Game",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Transaction_PaymentMethod_paymentId",
                table: "Transaction",
                column: "paymentId",
                principalTable: "PaymentMethod",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Transaction_Product_productId",
                table: "Transaction",
                column: "productId",
                principalTable: "Product",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AuditableTransaction_Transaction_originalTransactionId",
                table: "AuditableTransaction");

            migrationBuilder.DropForeignKey(
                name: "FK_Transaction_Game_gameId",
                table: "Transaction");

            migrationBuilder.DropForeignKey(
                name: "FK_Transaction_PaymentMethod_paymentId",
                table: "Transaction");

            migrationBuilder.DropForeignKey(
                name: "FK_Transaction_Product_productId",
                table: "Transaction");

            migrationBuilder.DropTable(
                name: "OrderStatusHistory");

            migrationBuilder.DropTable(
                name: "ProviderSyncLog");

            migrationBuilder.DropIndex(
                name: "IX_SystemAudit_EntityId",
                table: "SystemAudit");

            migrationBuilder.DropIndex(
                name: "IX_AuditableTransaction_OriginalTransactionId",
                table: "AuditableTransaction");

            migrationBuilder.RenameIndex(
                name: "IX_Transaction_PromoId",
                table: "Transaction",
                newName: "IX_Transaction_promoId");

            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:Enum:KycStatus", "BANNED,PENDING,REJECTED,UNVERIFIED,VERIFIED")
                .Annotation("Npgsql:Enum:KycStatus.kyc_status", "unverified,pending,verified,rejected,banned")
                .Annotation("Npgsql:Enum:MutationType", "ADJUSTMENT,COMMISSION,DEPOSIT,PAYMENT,REFUND,WITHDRAWAL")
                .Annotation("Npgsql:Enum:MutationType.mutation_type", "deposit,payment,refund,commission,withdrawal,adjustment")
                .Annotation("Npgsql:Enum:OrderStatus", "ERROR,PARTIAL,PENDING,PROCESSING,REFUNDING,SUCCESS")
                .Annotation("Npgsql:Enum:OrderStatus.order_status", "pending,processing,success,error,partial,refunding")
                .Annotation("Npgsql:Enum:PaymentStatus", "CHARGEBACK,EXPIRED,FAILED,PAID,PENDING,REFUNDED,UNPAID")
                .Annotation("Npgsql:Enum:PaymentStatus.payment_status", "unpaid,pending,paid,expired,failed,refunded,chargeback")
                .Annotation("Npgsql:Enum:PaymentType", "EWALLET,QRIS,RETAIL,VIRTUAL_ACCOUNT")
                .Annotation("Npgsql:Enum:PaymentType.payment_type", "ewallet,qris,virtual_account,retail")
                .Annotation("Npgsql:Enum:PromoType", "FLAT,PERCENTAGE")
                .Annotation("Npgsql:Enum:PromoType.promo_type", "flat,percentage")
                .Annotation("Npgsql:Enum:ProviderSource", "DIGIFLAZZ,VIP")
                .Annotation("Npgsql:Enum:ProviderSource.provider_source", "vip,digiflazz")
                .Annotation("Npgsql:Enum:Role", "CS,FINANCE,MEMBER,RESELLER,SUPERADMIN,VIP")
                .Annotation("Npgsql:Enum:Role.role", "member,reseller,vip,cs,finance,superadmin")
                .Annotation("Npgsql:Enum:TicketPriority", "HIGH,LOW,MEDIUM,URGENT")
                .Annotation("Npgsql:Enum:TicketPriority.ticket_priority", "low,medium,high,urgent")
                .Annotation("Npgsql:Enum:TicketStatus", "CLOSED,IN_PROGRESS,OPEN,RESOLVED,WAITING_USER")
                .Annotation("Npgsql:Enum:TicketStatus.ticket_status", "open,in_progress,waiting_user,resolved,closed")
                .OldAnnotation("Npgsql:Enum:KycStatus", "BANNED,PENDING,REJECTED,UNVERIFIED,VERIFIED")
                .OldAnnotation("Npgsql:Enum:KycStatus.kyc_status", "unverified,pending,verified,rejected,banned")
                .OldAnnotation("Npgsql:Enum:MutationType", "ADJUSTMENT,COMMISSION,DEPOSIT,PAYMENT,REFUND,WITHDRAWAL")
                .OldAnnotation("Npgsql:Enum:MutationType.mutation_type", "deposit,payment,refund,commission,withdrawal,adjustment")
                .OldAnnotation("Npgsql:Enum:OrderStatus", "CANCELLED,DRAFT,ERROR,FAILED,PARTIAL,PENDING,PROCESSING,REFUNDED,REFUNDING,SUCCESS")
                .OldAnnotation("Npgsql:Enum:OrderStatus.order_status", "draft,pending,processing,success,failed,error,partial,refunding,refunded,cancelled")
                .OldAnnotation("Npgsql:Enum:PaymentStatus", "CHARGEBACK,EXPIRED,FAILED,PAID,PENDING,REFUNDED,UNPAID")
                .OldAnnotation("Npgsql:Enum:PaymentStatus.payment_status", "unpaid,pending,paid,expired,failed,refunded,chargeback")
                .OldAnnotation("Npgsql:Enum:PaymentType", "EWALLET,QRIS,RETAIL,VIRTUAL_ACCOUNT")
                .OldAnnotation("Npgsql:Enum:PaymentType.payment_type", "ewallet,qris,virtual_account,retail")
                .OldAnnotation("Npgsql:Enum:PromoType", "FLAT,PERCENTAGE")
                .OldAnnotation("Npgsql:Enum:PromoType.promo_type", "flat,percentage")
                .OldAnnotation("Npgsql:Enum:ProviderSource", "DIGIFLAZZ,VIP")
                .OldAnnotation("Npgsql:Enum:ProviderSource.provider_source", "vip,digiflazz")
                .OldAnnotation("Npgsql:Enum:Role", "CS,FINANCE,MEMBER,RESELLER,SUPERADMIN,VIP")
                .OldAnnotation("Npgsql:Enum:Role.role", "member,reseller,vip,cs,finance,superadmin")
                .OldAnnotation("Npgsql:Enum:TicketPriority", "HIGH,LOW,MEDIUM,URGENT")
                .OldAnnotation("Npgsql:Enum:TicketPriority.ticket_priority", "low,medium,high,urgent")
                .OldAnnotation("Npgsql:Enum:TicketStatus", "CLOSED,IN_PROGRESS,OPEN,RESOLVED,WAITING_USER")
                .OldAnnotation("Npgsql:Enum:TicketStatus.ticket_status", "open,in_progress,waiting_user,resolved,closed");

            migrationBuilder.AddForeignKey(
                name: "FK_Transaction_Game_gameId",
                table: "Transaction",
                column: "gameId",
                principalTable: "Game",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Transaction_PaymentMethod_paymentId",
                table: "Transaction",
                column: "paymentId",
                principalTable: "PaymentMethod",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Transaction_Product_productId",
                table: "Transaction",
                column: "productId",
                principalTable: "Product",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
