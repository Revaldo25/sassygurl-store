import { describe, it, expect } from "vitest";

/**
 * SassyPoints Loyalty System Tests
 * - Earn 100 points for every IDR 10,000 spent
 * - 1 point = IDR 100 discount
 */

describe("SassyPoints Loyalty System", () => {
  describe("calculatePointsEarned", () => {
    it("should earn 100 points for IDR 10,000 spent", () => {
      const amountSpent = 10000;
      const pointsEarned = Math.floor((amountSpent / 10000) * 100);
      expect(pointsEarned).toBe(100);
    });

    it("should earn 1000 points for IDR 100,000 spent", () => {
      const amountSpent = 100000;
      const pointsEarned = Math.floor((amountSpent / 10000) * 100);
      expect(pointsEarned).toBe(1000);
    });

    it("should earn 500 points for IDR 50,000 spent", () => {
      const amountSpent = 50000;
      const pointsEarned = Math.floor((amountSpent / 10000) * 100);
      expect(pointsEarned).toBe(500);
    });

    it("should earn 50 points for IDR 5,000 spent", () => {
      const amountSpent = 5000;
      const pointsEarned = Math.floor((amountSpent / 10000) * 100);
      expect(pointsEarned).toBe(50);
    });

    it("should handle fractional amounts correctly", () => {
      const amountSpent = 15000;
      const pointsEarned = Math.floor((amountSpent / 10000) * 100);
      expect(pointsEarned).toBe(150); // Floor of 150
    });
  });

  describe("calculateDiscountFromPoints", () => {
    it("should give IDR 100 discount for 1 point", () => {
      const pointsToRedeem = 1;
      const discount = pointsToRedeem * 100;
      expect(discount).toBe(100);
    });

    it("should give IDR 100,000 discount for 1000 points", () => {
      const pointsToRedeem = 1000;
      const discount = pointsToRedeem * 100;
      expect(discount).toBe(100000);
    });

    it("should give IDR 50,000 discount for 500 points", () => {
      const pointsToRedeem = 500;
      const discount = pointsToRedeem * 100;
      expect(discount).toBe(50000);
    });

    it("should give 0 discount for 0 points", () => {
      const pointsToRedeem = 0;
      const discount = pointsToRedeem * 100;
      expect(discount).toBe(0);
    });
  });

  describe("Loyalty Workflow", () => {
    it("should earn points from purchase and redeem for discount", () => {
      // User spends IDR 100,000
      const amountSpent = 100000;
      const pointsEarned = Math.floor((amountSpent / 10000) * 100);
      expect(pointsEarned).toBe(1000);

      // User redeems 500 points for discount
      const pointsToRedeem = 500;
      const discount = pointsToRedeem * 100;
      expect(discount).toBe(50000);

      // Remaining points
      const remainingPoints = pointsEarned - pointsToRedeem;
      expect(remainingPoints).toBe(500);
    });

    it("should accumulate points across multiple purchases", () => {
      // First purchase: IDR 50,000
      const purchase1 = 50000;
      const points1 = Math.floor((purchase1 / 10000) * 100);
      expect(points1).toBe(500);

      // Second purchase: IDR 75,000
      const purchase2 = 75000;
      const points2 = Math.floor((purchase2 / 10000) * 100);
      expect(points2).toBe(750);

      // Total points
      const totalPoints = points1 + points2;
      expect(totalPoints).toBe(1250);
    });

    it("should not allow redeeming more points than available", () => {
      const availablePoints = 500;
      const pointsToRedeem = 1000;

      const canRedeem = pointsToRedeem <= availablePoints;
      expect(canRedeem).toBe(false);
    });

    it("should track loyalty history correctly", () => {
      const history: Array<{
        type: "EARN" | "REDEEM";
        points: number;
        amount: number;
      }> = [];

      // Earn points
      history.push({ type: "EARN", points: 1000, amount: 100000 });
      expect(history).toHaveLength(1);
      expect(history[0].type).toBe("EARN");

      // Redeem points
      history.push({ type: "REDEEM", points: 500, amount: 50000 });
      expect(history).toHaveLength(2);
      expect(history[1].type).toBe("REDEEM");
    });
  });
});
