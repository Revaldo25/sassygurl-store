using System;
using Microsoft.EntityFrameworkCore.Migrations;
using SassyGurl.Api.Models.Enums;

#nullable disable

namespace SassyGurl.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMemberLoyaltySystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:Enum:KycStatus", "BANNED,PENDING,REJECTED,UNVERIFIED,VERIFIED")
                .Annotation("Npgsql:Enum:KycStatus.kyc_status", "unverified,pending,verified,rejected,banned")
                .Annotation("Npgsql:Enum:MemberTier.member_tier", "bronze,silver,gold,platinum")
                .Annotation("Npgsql:Enum:MutationType", "ADJUSTMENT,COMMISSION,DEPOSIT,PAYMENT,POINT_EARN,POINT_EXPIRE,POINT_SPEND,REFUND,WITHDRAWAL")
                .Annotation("Npgsql:Enum:MutationType.mutation_type", "deposit,payment,refund,commission,withdrawal,adjustment,point_earn,point_spend,point_expire")
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
                .Annotation("Npgsql:Enum:Role", "CS,FINANCE,MEMBER,OWNER,RESELLER,SUPERADMIN,VIP")
                .Annotation("Npgsql:Enum:Role.role", "member,reseller,vip,cs,finance,superadmin,owner")
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
                .OldAnnotation("Npgsql:Enum:Role", "CS,FINANCE,MEMBER,OWNER,RESELLER,SUPERADMIN,VIP")
                .OldAnnotation("Npgsql:Enum:Role.role", "member,reseller,vip,cs,finance,superadmin,owner")
                .OldAnnotation("Npgsql:Enum:TicketPriority", "HIGH,LOW,MEDIUM,URGENT")
                .OldAnnotation("Npgsql:Enum:TicketPriority.ticket_priority", "low,medium,high,urgent")
                .OldAnnotation("Npgsql:Enum:TicketStatus", "CLOSED,IN_PROGRESS,OPEN,RESOLVED,WAITING_USER")
                .OldAnnotation("Npgsql:Enum:TicketStatus.ticket_status", "open,in_progress,waiting_user,resolved,closed");

            migrationBuilder.AddColumn<int>(
                name: "tier",
                table: "User",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "pointsDiscount",
                table: "Transaction",
                type: "numeric(10,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "pointsUsed",
                table: "Transaction",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "pointsCost",
                table: "Promo",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "overridePoints",
                table: "Product",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "PointLedger",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    userId = table.Column<string>(type: "text", nullable: false),
                    transactionId = table.Column<string>(type: "text", nullable: true),
                    type = table.Column<MutationType>(type: "\"MutationType\"", nullable: false),
                    debit = table.Column<int>(type: "integer", nullable: false),
                    credit = table.Column<int>(type: "integer", nullable: false),
                    balanceSnapshot = table.Column<int>(type: "integer", nullable: false),
                    description = table.Column<string>(type: "text", nullable: false),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PointLedger", x => x.id);
                    table.ForeignKey(
                        name: "FK_PointLedger_User_userId",
                        column: x => x.userId,
                        principalTable: "User",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PointLedger_userId",
                table: "PointLedger",
                column: "userId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PointLedger");

            migrationBuilder.DropColumn(
                name: "tier",
                table: "User");

            migrationBuilder.DropColumn(
                name: "pointsDiscount",
                table: "Transaction");

            migrationBuilder.DropColumn(
                name: "pointsUsed",
                table: "Transaction");

            migrationBuilder.DropColumn(
                name: "pointsCost",
                table: "Promo");

            migrationBuilder.DropColumn(
                name: "overridePoints",
                table: "Product");

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
                .Annotation("Npgsql:Enum:Role", "CS,FINANCE,MEMBER,OWNER,RESELLER,SUPERADMIN,VIP")
                .Annotation("Npgsql:Enum:Role.role", "member,reseller,vip,cs,finance,superadmin,owner")
                .Annotation("Npgsql:Enum:TicketPriority", "HIGH,LOW,MEDIUM,URGENT")
                .Annotation("Npgsql:Enum:TicketPriority.ticket_priority", "low,medium,high,urgent")
                .Annotation("Npgsql:Enum:TicketStatus", "CLOSED,IN_PROGRESS,OPEN,RESOLVED,WAITING_USER")
                .Annotation("Npgsql:Enum:TicketStatus.ticket_status", "open,in_progress,waiting_user,resolved,closed")
                .OldAnnotation("Npgsql:Enum:KycStatus", "BANNED,PENDING,REJECTED,UNVERIFIED,VERIFIED")
                .OldAnnotation("Npgsql:Enum:KycStatus.kyc_status", "unverified,pending,verified,rejected,banned")
                .OldAnnotation("Npgsql:Enum:MemberTier.member_tier", "bronze,silver,gold,platinum")
                .OldAnnotation("Npgsql:Enum:MutationType", "ADJUSTMENT,COMMISSION,DEPOSIT,PAYMENT,POINT_EARN,POINT_EXPIRE,POINT_SPEND,REFUND,WITHDRAWAL")
                .OldAnnotation("Npgsql:Enum:MutationType.mutation_type", "deposit,payment,refund,commission,withdrawal,adjustment,point_earn,point_spend,point_expire")
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
                .OldAnnotation("Npgsql:Enum:Role", "CS,FINANCE,MEMBER,OWNER,RESELLER,SUPERADMIN,VIP")
                .OldAnnotation("Npgsql:Enum:Role.role", "member,reseller,vip,cs,finance,superadmin,owner")
                .OldAnnotation("Npgsql:Enum:TicketPriority", "HIGH,LOW,MEDIUM,URGENT")
                .OldAnnotation("Npgsql:Enum:TicketPriority.ticket_priority", "low,medium,high,urgent")
                .OldAnnotation("Npgsql:Enum:TicketStatus", "CLOSED,IN_PROGRESS,OPEN,RESOLVED,WAITING_USER")
                .OldAnnotation("Npgsql:Enum:TicketStatus.ticket_status", "open,in_progress,waiting_user,resolved,closed");
        }
    }
}
