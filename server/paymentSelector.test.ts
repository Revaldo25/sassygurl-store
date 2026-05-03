import { describe, it, expect } from "vitest";
import { AdminFeeCalculator, LoyaltyService } from "./services";

describe("AdminFeeCalculator", () => {
  it("should calculate total amount correctly", () => {
    const productPrice = 100000;
    const adminFee = 5000;
    const total = AdminFeeCalculator.calculateTotalAmount(productPrice, adminFee);
    expect(total).toBe(105000);
  });

  it("should calculate discount correctly", () => {
    const totalAmount = 100000;
    const discountPercentage = 10;
    const discount = AdminFeeCalculator.calculateDiscount(totalAmount, discountPercentage);
    expect(discount).toBe(10000);
  });

  it("should calculate final amount with discount", () => {
    const productPrice = 100000;
    const adminFee = 5000;
    const discountPercentage = 10;
    const finalAmount = AdminFeeCalculator.calculateFinalAmount(
      productPrice,
      adminFee,
      discountPercentage
    );
    expect(finalAmount).toBe(94500); // (100000 + 5000) - 10500
  });

  it("should handle zero discount", () => {
    const productPrice = 100000;
    const adminFee = 5000;
    const finalAmount = AdminFeeCalculator.calculateFinalAmount(
      productPrice,
      adminFee,
      0
    );
    expect(finalAmount).toBe(105000);
  });
});

describe("LoyaltyService", () => {
  it("should calculate points earned correctly", () => {
    const amount = 100000; // Rp 100,000
    const points = LoyaltyService.calculatePointsEarned(amount);
    expect(points).toBe(1000); // 100 points per 10,000 IDR
  });

  it("should calculate points for 50000 IDR", () => {
    const amount = 50000;
    const points = LoyaltyService.calculatePointsEarned(amount);
    expect(points).toBe(500);
  });

  it("should calculate points for 15000 IDR", () => {
    const amount = 15000; // Should be 150 points (1.5 * 100)
    const points = LoyaltyService.calculatePointsEarned(amount);
    expect(points).toBe(150);
  });

  it("should handle zero amount", () => {
    const amount = 0;
    const points = LoyaltyService.calculatePointsEarned(amount);
    expect(points).toBe(0);
  });
});
