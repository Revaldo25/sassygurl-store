using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SassyGurl.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialBaseline : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:Enum:KycStatus.kyc_status", "unverified,pending,verified,rejected,banned")
                .Annotation("Npgsql:Enum:MutationType.mutation_type", "deposit,payment,refund,commission,withdrawal,adjustment")
                .Annotation("Npgsql:Enum:OrderStatus.order_status", "pending,processing,success,error,partial,refunding,cancelled,refunded")
                .Annotation("Npgsql:Enum:PaymentStatus.payment_status", "unpaid,pending,paid,expired,failed,refunded,chargeback")
                .Annotation("Npgsql:Enum:PaymentType.payment_type", "ewallet,qris,virtual_account,retail")
                .Annotation("Npgsql:Enum:PromoType.promo_type", "fixed,percentage")
                .Annotation("Npgsql:Enum:Role.role", "member,reseller,vip,cs,finance,superadmin")
                .Annotation("Npgsql:Enum:TicketPriority.ticket_priority", "low,medium,high,urgent")
                .Annotation("Npgsql:Enum:TicketStatus.ticket_status", "open,in_progress,waiting_user,resolved,closed");

            migrationBuilder.CreateTable(
                name: "Category",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    slug = table.Column<string>(type: "text", nullable: false),
                    sortOrder = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Category", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "PaymentMethod",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    code = table.Column<string>(type: "text", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    type = table.Column<int>(type: "integer", nullable: false),
                    logo = table.Column<string>(type: "text", nullable: true),
                    feeFlat = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    feePercent = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    isActive = table.Column<bool>(type: "boolean", nullable: false),
                    sortOrder = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PaymentMethod", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "Promo",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    code = table.Column<string>(type: "text", nullable: false),
                    title = table.Column<string>(type: "text", nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    type = table.Column<int>(type: "integer", nullable: false),
                    value = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    maxDiscount = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    minTransaction = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    quota = table.Column<int>(type: "integer", nullable: false),
                    usedCount = table.Column<int>(type: "integer", nullable: false),
                    startDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    endDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    isActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Promo", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "Provider",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    balance = table.Column<decimal>(type: "numeric(15,2)", nullable: false),
                    isActive = table.Column<bool>(type: "boolean", nullable: false),
                    successRate = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    avgLatencyMs = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Provider", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "User",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    name = table.Column<string>(type: "text", nullable: true),
                    email = table.Column<string>(type: "text", nullable: true),
                    emailVerified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    image = table.Column<string>(type: "text", nullable: true),
                    password = table.Column<string>(type: "text", nullable: true),
                    phone = table.Column<string>(type: "text", nullable: true),
                    role = table.Column<int>(type: "integer", nullable: false),
                    kycStatus = table.Column<int>(type: "integer", nullable: false),
                    isVerified = table.Column<bool>(type: "boolean", nullable: false),
                    idCardNumber = table.Column<string>(type: "text", nullable: true),
                    idCardImage = table.Column<string>(type: "text", nullable: true),
                    taxNumber = table.Column<string>(type: "text", nullable: true),
                    isTwoFactorEnable = table.Column<bool>(type: "boolean", nullable: false),
                    lastLoginIp = table.Column<string>(type: "text", nullable: true),
                    deviceId = table.Column<string>(type: "text", nullable: true),
                    balance = table.Column<decimal>(type: "numeric(15,2)", nullable: false),
                    points = table.Column<int>(type: "integer", nullable: false),
                    referralCode = table.Column<string>(type: "text", nullable: false),
                    referrerId = table.Column<string>(type: "text", nullable: true),
                    totalCommission = table.Column<decimal>(type: "numeric(15,2)", nullable: false),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_User", x => x.id);
                    table.ForeignKey(
                        name: "FK_User_User_referrerId",
                        column: x => x.referrerId,
                        principalTable: "User",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "VerificationToken",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    identifier = table.Column<string>(type: "text", nullable: false),
                    token = table.Column<string>(type: "text", nullable: false),
                    expires = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VerificationToken", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "Game",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    categoryId = table.Column<string>(type: "text", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    slug = table.Column<string>(type: "text", nullable: false),
                    publisher = table.Column<string>(type: "text", nullable: true),
                    thumbnail = table.Column<string>(type: "text", nullable: true),
                    banner = table.Column<string>(type: "text", nullable: true),
                    guideImage = table.Column<string>(type: "text", nullable: true),
                    hasServerId = table.Column<bool>(type: "boolean", nullable: false),
                    serverOptions = table.Column<string>(type: "jsonb", nullable: true),
                    isActive = table.Column<bool>(type: "boolean", nullable: false),
                    isHot = table.Column<bool>(type: "boolean", nullable: false),
                    sortOrder = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Game", x => x.id);
                    table.ForeignKey(
                        name: "FK_Game_Category_categoryId",
                        column: x => x.categoryId,
                        principalTable: "Category",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Account",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    userId = table.Column<string>(type: "text", nullable: false),
                    type = table.Column<string>(type: "text", nullable: false),
                    provider = table.Column<string>(type: "text", nullable: false),
                    providerAccountId = table.Column<string>(type: "text", nullable: false),
                    refreshToken = table.Column<string>(type: "text", nullable: true),
                    accessToken = table.Column<string>(type: "text", nullable: true),
                    expiresAt = table.Column<int>(type: "integer", nullable: true),
                    tokenType = table.Column<string>(type: "text", nullable: true),
                    scope = table.Column<string>(type: "text", nullable: true),
                    idToken = table.Column<string>(type: "text", nullable: true),
                    sessionState = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Account", x => x.id);
                    table.ForeignKey(
                        name: "FK_Account_User_userId",
                        column: x => x.userId,
                        principalTable: "User",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SupportTicket",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    ticketNumber = table.Column<string>(type: "text", nullable: false),
                    userId = table.Column<string>(type: "text", nullable: false),
                    subject = table.Column<string>(type: "text", nullable: false),
                    transactionId = table.Column<string>(type: "text", nullable: true),
                    status = table.Column<int>(type: "integer", nullable: false),
                    priority = table.Column<int>(type: "integer", nullable: false),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SupportTicket", x => x.id);
                    table.ForeignKey(
                        name: "FK_SupportTicket_User_userId",
                        column: x => x.userId,
                        principalTable: "User",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SystemAudit",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    actionBy = table.Column<string>(type: "text", nullable: false),
                    action = table.Column<string>(type: "text", nullable: false),
                    entity = table.Column<string>(type: "text", nullable: false),
                    entityId = table.Column<string>(type: "text", nullable: false),
                    oldValues = table.Column<string>(type: "jsonb", nullable: true),
                    newValues = table.Column<string>(type: "jsonb", nullable: true),
                    ipAddress = table.Column<string>(type: "text", nullable: true),
                    userAgent = table.Column<string>(type: "text", nullable: true),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SystemAudit", x => x.id);
                    table.ForeignKey(
                        name: "FK_SystemAudit_User_actionBy",
                        column: x => x.actionBy,
                        principalTable: "User",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WalletLedger",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    userId = table.Column<string>(type: "text", nullable: false),
                    transactionId = table.Column<string>(type: "text", nullable: true),
                    type = table.Column<int>(type: "integer", nullable: false),
                    debit = table.Column<decimal>(type: "numeric(15,2)", nullable: false),
                    credit = table.Column<decimal>(type: "numeric(15,2)", nullable: false),
                    balanceSnapshot = table.Column<decimal>(type: "numeric(15,2)", nullable: false),
                    description = table.Column<string>(type: "text", nullable: false),
                    performedById = table.Column<string>(type: "text", nullable: true),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WalletLedger", x => x.id);
                    table.ForeignKey(
                        name: "FK_WalletLedger_User_userId",
                        column: x => x.userId,
                        principalTable: "User",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Product",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    gameId = table.Column<string>(type: "text", nullable: false),
                    providerId = table.Column<string>(type: "text", nullable: false),
                    sku = table.Column<string>(type: "text", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    priceModal = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    priceSell = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    priceMember = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    priceReseller = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    priceVip = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    originalPrice = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    isActive = table.Column<bool>(type: "boolean", nullable: false),
                    isFlashSale = table.Column<bool>(type: "boolean", nullable: false),
                    stock = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Product", x => x.id);
                    table.ForeignKey(
                        name: "FK_Product_Game_gameId",
                        column: x => x.gameId,
                        principalTable: "Game",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Product_Provider_providerId",
                        column: x => x.providerId,
                        principalTable: "Provider",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Review",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    userId = table.Column<string>(type: "text", nullable: false),
                    gameId = table.Column<string>(type: "text", nullable: false),
                    transactionId = table.Column<string>(type: "text", nullable: false),
                    rating = table.Column<int>(type: "integer", nullable: false),
                    comment = table.Column<string>(type: "text", nullable: true),
                    images = table.Column<string>(type: "jsonb", nullable: true),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Review", x => x.id);
                    table.ForeignKey(
                        name: "FK_Review_Game_gameId",
                        column: x => x.gameId,
                        principalTable: "Game",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Review_User_userId",
                        column: x => x.userId,
                        principalTable: "User",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TicketMessage",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    ticketId = table.Column<string>(type: "text", nullable: false),
                    senderId = table.Column<string>(type: "text", nullable: false),
                    message = table.Column<string>(type: "text", nullable: false),
                    attachments = table.Column<string>(type: "jsonb", nullable: true),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TicketMessage", x => x.id);
                    table.ForeignKey(
                        name: "FK_TicketMessage_SupportTicket_ticketId",
                        column: x => x.ticketId,
                        principalTable: "SupportTicket",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Transaction",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    invoiceId = table.Column<string>(type: "text", nullable: false),
                    userId = table.Column<string>(type: "text", nullable: true),
                    gameId = table.Column<string>(type: "text", nullable: false),
                    productId = table.Column<string>(type: "text", nullable: false),
                    sku = table.Column<string>(type: "text", nullable: false),
                    denomName = table.Column<string>(type: "text", nullable: false),
                    targetId = table.Column<string>(type: "text", nullable: false),
                    zoneId = table.Column<string>(type: "text", nullable: true),
                    targetName = table.Column<string>(type: "text", nullable: true),
                    email = table.Column<string>(type: "text", nullable: true),
                    whatsapp = table.Column<string>(type: "text", nullable: true),
                    paymentId = table.Column<string>(type: "text", nullable: false),
                    promoId = table.Column<string>(type: "text", nullable: true),
                    priceModal = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    priceSell = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    adminFee = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    taxVat = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    discount = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    totalAmount = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    profit = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    paymentStatus = table.Column<int>(type: "integer", nullable: false),
                    orderStatus = table.Column<int>(type: "integer", nullable: false),
                    paymentRef = table.Column<string>(type: "text", nullable: true),
                    providerRef = table.Column<string>(type: "text", nullable: true),
                    sn = table.Column<string>(type: "text", nullable: true),
                    webhookData = table.Column<string>(type: "jsonb", nullable: true),
                    createdAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    expiredAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    paidAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    completedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Transaction", x => x.id);
                    table.ForeignKey(
                        name: "FK_Transaction_Game_gameId",
                        column: x => x.gameId,
                        principalTable: "Game",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Transaction_PaymentMethod_paymentId",
                        column: x => x.paymentId,
                        principalTable: "PaymentMethod",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Transaction_Product_productId",
                        column: x => x.productId,
                        principalTable: "Product",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Transaction_Promo_promoId",
                        column: x => x.promoId,
                        principalTable: "Promo",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_Transaction_User_userId",
                        column: x => x.userId,
                        principalTable: "User",
                        principalColumn: "id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Account_provider_providerAccountId",
                table: "Account",
                columns: new[] { "provider", "providerAccountId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Account_userId",
                table: "Account",
                column: "userId");

            migrationBuilder.CreateIndex(
                name: "IX_Category_slug",
                table: "Category",
                column: "slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Game_categoryId",
                table: "Game",
                column: "categoryId");

            migrationBuilder.CreateIndex(
                name: "IX_Game_slug",
                table: "Game",
                column: "slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PaymentMethod_code",
                table: "PaymentMethod",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Product_gameId",
                table: "Product",
                column: "gameId");

            migrationBuilder.CreateIndex(
                name: "IX_Product_providerId",
                table: "Product",
                column: "providerId");

            migrationBuilder.CreateIndex(
                name: "IX_Product_sku",
                table: "Product",
                column: "sku",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Product_sku_gameId_isActive",
                table: "Product",
                columns: new[] { "sku", "gameId", "isActive" });

            migrationBuilder.CreateIndex(
                name: "IX_Promo_code",
                table: "Promo",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Provider_name",
                table: "Provider",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Review_gameId_rating",
                table: "Review",
                columns: new[] { "gameId", "rating" });

            migrationBuilder.CreateIndex(
                name: "IX_Review_transactionId",
                table: "Review",
                column: "transactionId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Review_userId",
                table: "Review",
                column: "userId");

            migrationBuilder.CreateIndex(
                name: "IX_SupportTicket_ticketNumber",
                table: "SupportTicket",
                column: "ticketNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SupportTicket_userId_status",
                table: "SupportTicket",
                columns: new[] { "userId", "status" });

            migrationBuilder.CreateIndex(
                name: "IX_SystemAudit_actionBy_entity_createdAt",
                table: "SystemAudit",
                columns: new[] { "actionBy", "entity", "createdAt" });

            migrationBuilder.CreateIndex(
                name: "IX_TicketMessage_ticketId",
                table: "TicketMessage",
                column: "ticketId");

            migrationBuilder.CreateIndex(
                name: "IX_Transaction_createdAt",
                table: "Transaction",
                column: "createdAt");

            migrationBuilder.CreateIndex(
                name: "IX_Transaction_gameId",
                table: "Transaction",
                column: "gameId");

            migrationBuilder.CreateIndex(
                name: "IX_Transaction_invoiceId",
                table: "Transaction",
                column: "invoiceId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Transaction_invoiceId_paymentStatus_orderStatus",
                table: "Transaction",
                columns: new[] { "invoiceId", "paymentStatus", "orderStatus" });

            migrationBuilder.CreateIndex(
                name: "IX_Transaction_paymentId",
                table: "Transaction",
                column: "paymentId");

            migrationBuilder.CreateIndex(
                name: "IX_Transaction_productId",
                table: "Transaction",
                column: "productId");

            migrationBuilder.CreateIndex(
                name: "IX_Transaction_promoId",
                table: "Transaction",
                column: "promoId");

            migrationBuilder.CreateIndex(
                name: "IX_Transaction_targetId",
                table: "Transaction",
                column: "targetId");

            migrationBuilder.CreateIndex(
                name: "IX_Transaction_userId",
                table: "Transaction",
                column: "userId");

            migrationBuilder.CreateIndex(
                name: "IX_User_email",
                table: "User",
                column: "email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_User_email_phone_referralCode",
                table: "User",
                columns: new[] { "email", "phone", "referralCode" });

            migrationBuilder.CreateIndex(
                name: "IX_User_idCardNumber",
                table: "User",
                column: "idCardNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_User_kycStatus",
                table: "User",
                column: "kycStatus");

            migrationBuilder.CreateIndex(
                name: "IX_User_phone",
                table: "User",
                column: "phone",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_User_referralCode",
                table: "User",
                column: "referralCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_User_referrerId",
                table: "User",
                column: "referrerId");

            migrationBuilder.CreateIndex(
                name: "IX_VerificationToken_identifier_token",
                table: "VerificationToken",
                columns: new[] { "identifier", "token" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_VerificationToken_token",
                table: "VerificationToken",
                column: "token",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_WalletLedger_transactionId",
                table: "WalletLedger",
                column: "transactionId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_WalletLedger_userId_type_createdAt",
                table: "WalletLedger",
                columns: new[] { "userId", "type", "createdAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Account");

            migrationBuilder.DropTable(
                name: "Review");

            migrationBuilder.DropTable(
                name: "SystemAudit");

            migrationBuilder.DropTable(
                name: "TicketMessage");

            migrationBuilder.DropTable(
                name: "Transaction");

            migrationBuilder.DropTable(
                name: "VerificationToken");

            migrationBuilder.DropTable(
                name: "WalletLedger");

            migrationBuilder.DropTable(
                name: "SupportTicket");

            migrationBuilder.DropTable(
                name: "PaymentMethod");

            migrationBuilder.DropTable(
                name: "Product");

            migrationBuilder.DropTable(
                name: "Promo");

            migrationBuilder.DropTable(
                name: "User");

            migrationBuilder.DropTable(
                name: "Game");

            migrationBuilder.DropTable(
                name: "Provider");

            migrationBuilder.DropTable(
                name: "Category");
        }
    }
}
