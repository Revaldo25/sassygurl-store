# SassyGurl Store - System Architecture

## Overview

SassyGurl is a premium Indonesian game top-up platform combining an elegant payment method selector with real-time provider status, loyalty rewards, and administrative tools. The architecture prioritizes real-time updates, type safety, and premium user experience.

## Technology Stack

**Frontend:** React 19 + Tailwind CSS 4 + Framer Motion + Zustand + Zod
**Backend:** Express 4 + tRPC 11 + Socket.io (real-time)
**Database:** PostgreSQL 18.3 with JSONB support
**Authentication:** Manus OAuth
**Storage:** S3 (payment logos, QR codes)
**Notifications:** Fonnte WhatsApp API
**Payment Gateway:** Antigravity/Tripay API

## Database Schema

### Core Tables

**payment_methods**
- id (PK)
- name (e.g., "GoPay", "BCA")
- category (ENUM: QRIS, EWALLET, VA, RETAIL)
- logo_url (S3 path to WebP)
- admin_fee (numeric, in IDR)
- is_active (boolean)
- usage_count (for smart sorting)
- created_at, updated_at

**payment_categories**
- id (PK)
- name (QRIS, E-Wallet, Virtual Account, Retail Outlet)
- display_order (for consistent ordering)
- created_at

**provider_status**
- id (PK)
- provider_name (e.g., "Antigravity", "Tripay")
- is_online (boolean)
- last_checked_at (timestamp)
- status_message (nullable)
- created_at, updated_at

**products**
- id (PK)
- game_name (e.g., "Mobile Legends")
- sku (unique identifier)
- base_price (in IDR)
- logo_url (S3 path)
- is_active (boolean)
- category (ENUM: TOPUP, VOUCHER)
- created_at, updated_at

**flash_sales**
- id (PK)
- product_id (FK)
- discount_percentage (numeric)
- start_time (timestamp)
- end_time (timestamp)
- stock_limit (nullable)
- is_active (boolean)
- created_at, updated_at

**users** (extended)
- id (PK)
- openId (Manus OAuth)
- email, name, role
- sassy_points_balance (numeric, default 0)
- created_at, updated_at

**loyalty_history** (JSONB)
- id (PK)
- user_id (FK)
- transaction_type (ENUM: EARN, REDEEM)
- points_amount (numeric)
- related_order_id (nullable FK)
- metadata (JSONB: {order_amount, product_name, etc.})
- created_at

**transactions**
- id (PK)
- user_id (FK)
- product_id (FK)
- payment_method_id (FK)
- order_amount (numeric, product price)
- admin_fee (numeric, payment method fee)
- total_amount (numeric, order_amount + admin_fee)
- sassy_points_earned (numeric)
- sassy_points_redeemed (numeric)
- status (ENUM: PENDING, CONFIRMED, FAILED)
- whatsapp_sent (boolean)
- created_at, updated_at

## Backend Architecture

### Real-Time Updates (Socket.io)

**Events:**
- `provider_status_update` — Broadcast when a provider's status changes
- `payment_method_update` — Broadcast when payment methods are modified
- `flash_sale_update` — Broadcast flash sale countdown updates

**Implementation:**
- Socket.io namespace: `/api/socket`
- Authenticated connections via JWT in query params
- Rooms per user for targeted notifications

### tRPC Procedures

**Payment Methods Router**
- `getPaymentMethods(category?)` — Fetch methods with smart sorting
- `getPaymentMethodDetails(id)` — Fetch single method with current status
- `calculateFee(methodId, amount)` — Calculate admin fee (client-side validation)

**Products Router**
- `getProducts(filters)` — Fetch all products with status
- `getFlashSales()` — Fetch active flash sales
- `getProductDetails(id)` — Fetch single product

**Transactions Router** (protected)
- `createTransaction(payload)` — Create new transaction
- `getTransactionHistory()` — Fetch user's transactions
- `confirmTransaction(id)` — Confirm payment (admin only)

**Loyalty Router** (protected)
- `getLoyaltyBalance()` — Get user's SassyPoints balance
- `getLoyaltyHistory(limit, offset)` — Fetch points history
- `redeemPoints(amount)` — Redeem points for discount

**Admin Router** (admin only)
- `getRevenueStats(dateRange)` — Fetch revenue data for graphs
- `getTransactionLogs(filters)` — Fetch filterable transaction logs
- `toggleProductStatus(productId)` — Enable/disable product
- `updateProviderStatus(providerId, status)` — Update provider status

### Backend Services

**PaymentService**
- Fetches payment methods from database
- Implements smart sorting: usage_count DESC, admin_fee ASC
- Caches results for 5 minutes
- Queries use AsNoTracking equivalent (read-only)

**ProviderStatusService**
- Polls payment gateway APIs every 30 seconds
- Broadcasts updates via Socket.io
- Stores status in database for persistence
- Handles offline gracefully

**LoyaltyService**
- Calculates points earned (100 per IDR 10,000)
- Tracks history in JSONB for flexibility
- Handles point redemption and discount calculation
- Validates point balance before redemption

**NotificationService**
- Integrates Fonnte WhatsApp API
- Sends messages after transaction confirmation
- Includes order details and game account check prompt
- Retries on failure (up to 3 times)

**TransactionService**
- Orchestrates payment flow
- Calculates total amount (product + admin fee)
- Triggers loyalty points earning
- Triggers WhatsApp notification
- Updates provider status on confirmation

## Frontend Architecture

### State Management

**Zustand Stores:**
- `searchStore` — Search query, filtered results, loading state
- `paymentStore` — Selected payment method, admin fee calculation
- `loyaltyStore` — User's points balance and history
- `adminStore` — Transaction filters, graph date range

### Component Hierarchy

**Payment Selector (Premium)**
- `PaymentMethodSelector` (container)
  - `PaymentCategoryGroup` (Framer Motion Layout)
    - `PaymentMethodCard` (Glassmorphism, hover animation)
      - `StatusIndicator` (real-time via Socket.io)
      - `AdminFeeDisplay` (Zod-validated calculation)
      - `CopyButton` / `SaveQRButton` (with toast)
  - `PaymentSearchInput` (filter by name)
  - `SkeletonLoader` (shimmer effect)

**Product Showcase**
- `ProductGrid` (responsive layout)
  - `ProductCard` (with provider status light)
  - `FlashSaleCard` (with countdown timer, glow animation)

**Smart Search**
- `SmartSearchInput` (Zustand-powered)
  - `SearchResultsDropdown` (with product previews)

**Admin Dashboard**
- `AdminLayout` (sidebar navigation)
  - `RevenueGraph` (Recharts, hoverable)
  - `TransactionLogs` (filterable table)
  - `ProductTogglePanel` (enable/disable)

### Styling & Animations

**Glassmorphism Payment Cards:**
- Background: `rgba(255, 255, 255, 0.1)` with backdrop blur
- Border: `1px solid rgba(255, 255, 255, 0.2)`
- Glow effect: `box-shadow: 0 0 20px rgba(99, 102, 241, 0.3)`

**Framer Motion Animations:**
- Payment method selection: Scale + opacity transition (0.3s)
- Category expand/collapse: Layout animation with stagger
- Hover effects: Scale 1.05, glow intensifies
- Flash sale countdown: Pulse animation on timer

**Toast Notifications:**
- Success: "Berhasil Disalin" (exact label)
- Position: Bottom-right
- Auto-dismiss: 3 seconds

## Real-Time Data Flow

1. **Provider Status Update**
   - Backend polls gateway API every 30s
   - Status changes trigger Socket.io broadcast
   - Frontend receives update and re-renders status indicator
   - No page refresh required

2. **Payment Method Selection**
   - User selects method
   - Frontend calculates admin fee (Zod validation)
   - Total amount updates in real-time
   - Selection triggers Framer Motion animation

3. **Transaction Confirmation**
   - Backend confirms payment
   - Loyalty points calculated and stored
   - WhatsApp notification triggered
   - Socket.io broadcasts transaction update to admin dashboard

## Performance Optimizations

- **Database Caching:** PaymentService caches for 5 minutes
- **Read-Only Queries:** AsNoTracking for payment methods
- **Client-Side Calculation:** Admin fee computed locally (no API call)
- **Lazy Loading:** Product images load on demand
- **WebP Optimization:** All logos stored as WebP (30-40% smaller)
- **Socket.io Rooms:** Only send updates to relevant clients

## Security Considerations

- **Authentication:** All protected procedures require Manus OAuth
- **Authorization:** Admin procedures check `user.role === 'admin'`
- **Input Validation:** Zod schemas on all inputs
- **CORS:** Configured for frontend origin only
- **Rate Limiting:** Implement on transaction creation (prevent abuse)
- **Sensitive Data:** WhatsApp API key stored in environment variables

## Deployment Checklist

- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] S3 bucket created and payment logos uploaded
- [ ] Socket.io configured for production
- [ ] WhatsApp API credentials verified
- [ ] Payment gateway API credentials verified
- [ ] Admin user created
- [ ] SSL certificates configured
- [ ] Rate limiting enabled
- [ ] Monitoring and logging setup
