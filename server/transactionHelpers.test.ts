import { describe, it, expect } from "vitest";
import {
  generateVirtualAccountNumber,
  generateQRISString,
  formatVirtualAccountNumber,
  createPaymentInstruction,
} from "./transactionHelpers";

describe("Transaction Helpers", () => {
  describe("generateVirtualAccountNumber", () => {
    it("should generate a valid VA number for BCA", () => {
      const va = generateVirtualAccountNumber(123, 6); // 6 = BCA
      expect(va).toMatch(/^10\d{14}$/); // 10 (BCA) + 5 digit user + 8 digit random
      expect(va.startsWith("10")).toBe(true);
    });

    it("should generate a valid VA number for BNI", () => {
      const va = generateVirtualAccountNumber(456, 7); // 7 = BNI
      expect(va).toMatch(/^14\d{14}$/);
      expect(va.startsWith("14")).toBe(true);
    });

    it("should generate a valid VA number for Mandiri", () => {
      const va = generateVirtualAccountNumber(789, 8); // 8 = Mandiri
      expect(va).toMatch(/^15\d{14}$/);
      expect(va.startsWith("15")).toBe(true);
    });

    it("should include user ID in VA number", () => {
      const va = generateVirtualAccountNumber(123, 6);
      expect(va.substring(2, 7)).toBe("00123"); // User ID padded
    });

    it("should generate different VA numbers for same user", () => {
      const va1 = generateVirtualAccountNumber(123, 6);
      const va2 = generateVirtualAccountNumber(123, 6);
      expect(va1).not.toBe(va2); // Random part should differ
    });
  });

  describe("formatVirtualAccountNumber", () => {
    it("should format VA number correctly", () => {
      const formatted = formatVirtualAccountNumber("1001234567890123");
      expect(formatted).toBe("10 0123 4567 890123");
    });

    it("should handle different VA formats", () => {
      const formatted = formatVirtualAccountNumber("14123456789012");
      expect(formatted).toMatch(/^\d{2}\s\d{4}\s\d{4}\s\d+$/);
    });
  });

  describe("generateQRISString", () => {
    it("should generate a valid QRIS string", () => {
      const qris = generateQRISString("MERCHANT123", 100000, "TXN001");
      expect(qris).toContain("00020126");
      expect(qris).toContain("MERCHANT123");
      expect(qris).toContain("100000");
    });

    it("should include transaction ID", () => {
      const qris = generateQRISString("MERCHANT123", 100000, "TXN001");
      expect(qris).toContain("TXN001");
    });
  });

  describe("createPaymentInstruction", () => {
    it("should create VA instruction for Virtual Account", () => {
      const instruction = createPaymentInstruction(
        "BCA Virtual Account",
        "1001234567890123"
      );
      expect(instruction.type).toBe("VA");
      expect(instruction.copyableValue).toBe("1001234567890123");
      expect(instruction.displayText).toContain("Transfer ke nomor rekening");
    });

    it("should create QRIS instruction for QRIS", () => {
      const qrUrl = "https://example.com/qr.png";
      const instruction = createPaymentInstruction("QRIS", undefined, qrUrl);
      expect(instruction.type).toBe("QRIS");
      expect(instruction.qrCodeUrl).toBe(qrUrl);
      expect(instruction.displayText).toContain("Scan kode QR");
    });

    it("should create E-Wallet instruction for GoPay", () => {
      const instruction = createPaymentInstruction("GoPay");
      expect(instruction.type).toBe("EWALLET");
      expect(instruction.displayText).toContain("GoPay");
    });

    it("should create Retail instruction for Indomaret", () => {
      const instruction = createPaymentInstruction("Indomaret");
      expect(instruction.type).toBe("RETAIL");
      expect(instruction.displayText).toContain("Indomaret");
    });

    it("should set expiration time if provided", () => {
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now
      const instruction = createPaymentInstruction(
        "QRIS",
        undefined,
        undefined,
        expiresAt
      );
      expect(instruction.expiresAt).toEqual(expiresAt);
    });
  });
});
