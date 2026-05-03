# SassyGurl Store - Project TODO

## Payment Method Selector (Core Feature)
- [x] Design database schema for payment methods, categories, and admin fees
- [x] Implement PaymentService backend with smart sorting logic
- [x] Build Glow UI payment method cards with Glassmorphism styling
- [x] Implement Framer Motion hover states and selection animations
- [x] Create payment method category groups (QRIS, E-Wallet, VA, Retail)
- [x] Add Framer Motion Layout Animations for category expand/collapse
- [x] Implement real-time Online/Offline status indicators
- [x] Build dynamic admin fee calculator (client-side, Zod + TypeScript)
- [x] Create skeleton shimmer loading screen
- [x] Add one-click Copy button for VA numbers with toast notification
- [x] Add Save QR button for QRIS with toast notification
- [x] Implement search/filter input for payment methods
- [x] Optimize and upload payment method logos as WebP
- [x] Display logos in 1:1 aspect ratio grid with hover animations

## Real-Time Provider Status (WebSocket)
- [ ] Design provider status schema in database
- [ ] Implement Socket.io integration for real-time updates
- [ ] Build provider status indicator UI component
- [ ] Create backend service to fetch and broadcast provider status
- [ ] Add green/red status light on product cards

## SassyPoints Loyalty System
- [ ] Design loyalty points schema (JSONB for history)
- [ ] Implement points earning logic (100 points per IDR 10,000)
- [ ] Build points display and redemption UI
- [ ] Create points history tracking
- [ ] Implement discount calculation from redeemed points

## WhatsApp Notifications
- [ ] Integrate Fonnte WhatsApp API
- [ ] Design notification message template
- [ ] Implement backend trigger after payment confirmation
- [ ] Test WhatsApp message delivery

## Flash Sales Section
- [ ] Design flash sale schema in database
- [ ] Create flash sale product card component
- [ ] Implement countdown timer with Framer Motion glow effect
- [ ] Build flash sale section on homepage
- [ ] Add urgency/FOMO animations

## Smart Search with Product Previews
- [ ] Implement Zustand store for search state
- [ ] Build search input component
- [ ] Create product preview dropdown
- [ ] Add real-time filtering with product images
- [ ] Optimize search performance

## Admin Dashboard
- [ ] Create admin layout and navigation
- [ ] Build Recharts revenue graph component
- [ ] Implement filterable transaction logs
- [ ] Add product disable/enable toggle
- [ ] Create admin-only access controls

## General Setup
- [ ] Collect and optimize payment method logos (WebP format)
- [ ] Setup GitHub repository
- [ ] Configure environment variables
- [ ] Create database migrations
- [ ] Setup Socket.io for real-time updates
- [ ] Implement error handling and validation
- [ ] Add unit tests for critical features
- [ ] Performance optimization and testing


## Phase 4 Gap Fixes
- [x] Create seed data script for four payment categories (QRIS, E-Wallet, Virtual Account, Retail Outlet)
- [x] Populate seed data with Indonesian payment methods (GoPay, OVO, Dana, BCA, BNI, Mandiri, etc.)
- [x] Implement transaction-based VA number retrieval for Copy button
- [x] Implement QR code generation and download for QRIS payment method
- [ ] Create shimmer animation on skeleton loader
- [ ] Implement payment logo grid with 1:1 aspect ratio and hover scale animation
- [ ] Wire real payment gateway status to online/offline indicators
