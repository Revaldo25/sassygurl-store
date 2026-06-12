using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SassyGurl.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddProductCategories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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

            migrationBuilder.AddColumn<string>(
                name: "productCategoryId",
                table: "Product",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ProductCategory",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    gameId = table.Column<string>(type: "text", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    icon = table.Column<string>(type: "text", nullable: false),
                    sortOrder = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductCategory", x => x.id);
                    table.ForeignKey(
                        name: "FK_ProductCategory_Game_gameId",
                        column: x => x.gameId,
                        principalTable: "Game",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Product_productCategoryId",
                table: "Product",
                column: "productCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductCategory_gameId",
                table: "ProductCategory",
                column: "gameId");

            migrationBuilder.AddForeignKey(
                name: "FK_Product_ProductCategory_productCategoryId",
                table: "Product",
                column: "productCategoryId",
                principalTable: "ProductCategory",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Product_ProductCategory_productCategoryId",
                table: "Product");

            migrationBuilder.DropTable(
                name: "ProductCategory");

            migrationBuilder.DropIndex(
                name: "IX_Product_productCategoryId",
                table: "Product");

            migrationBuilder.DropColumn(
                name: "productCategoryId",
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
                .OldAnnotation("Npgsql:Enum:Role", "CS,FINANCE,MEMBER,OWNER,RESELLER,SUPERADMIN,VIP")
                .OldAnnotation("Npgsql:Enum:Role.role", "member,reseller,vip,cs,finance,superadmin,owner")
                .OldAnnotation("Npgsql:Enum:TicketPriority", "HIGH,LOW,MEDIUM,URGENT")
                .OldAnnotation("Npgsql:Enum:TicketPriority.ticket_priority", "low,medium,high,urgent")
                .OldAnnotation("Npgsql:Enum:TicketStatus", "CLOSED,IN_PROGRESS,OPEN,RESOLVED,WAITING_USER")
                .OldAnnotation("Npgsql:Enum:TicketStatus.ticket_status", "open,in_progress,waiting_user,resolved,closed");
        }
    }
}
