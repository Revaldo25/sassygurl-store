import { nanoid } from "nanoid";

/**
 * Generates a virtual account number based on transaction ID and payment method
 * Format: [BANK_CODE][USER_ID][RANDOM]
 * Example: 1001234567890123 (BCA: 10, User: 01234, Random: 567890123)
 */
export function generateVirtualAccountNumber(
  userId: number,
  paymentMethodId: number
): string {
  // Bank code mapping
  const bankCodes: Record<number, string> = {
    6: "10", // BCA
    7: "14", // BNI
    8: "15", // Mandiri
    9: "19", // Permata
  };

  const bankCode = bankCodes[paymentMethodId] || "10";
  const userPart = String(userId).padStart(5, "0");
  // Generate 9 random digits to make total 16 digits (2 + 5 + 9)
  let randomPart = "";
  for (let i = 0; i < 9; i++) {
    randomPart += Math.floor(Math.random() * 10);
  }

  return `${bankCode}${userPart}${randomPart}`;
}

/**
 * Generates a QRIS (Quick Response Code Indonesian Standard) string
 * This is a simplified version - real QRIS would include merchant details
 */
export function generateQRISString(
  merchantId: string,
  amount: number,
  transactionId: string
): string {
  // Simplified QRIS format
  // Real implementation would use EMV QR Code standard
  return `00020126360014ID.CO.QRIS.WWW01189360010${merchantId}0215${transactionId}5204581153033605802ID5913SASSYGURL6009JAKARTA62410520${amount}63041234`;
}

/**
 * Generates a QR code image URL using a QR code service
 * In production, this would call a QR code generation API or library
 */
export async function generateQRCodeImage(
  qrisString: string,
  size: number = 300
): Promise<string> {
  // Using QR Server API (free, no auth required)
  const encodedQRIS = encodeURIComponent(qrisString);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedQRIS}`;
}

/**
 * Formats virtual account number for display
 * Example: 1001234567890123 -> 10 0123 4567 890123
 */
export function formatVirtualAccountNumber(vaNumber: string): string {
  return `${vaNumber.substring(0, 2)} ${vaNumber.substring(2, 6)} ${vaNumber.substring(6, 10)} ${vaNumber.substring(10)}`;
}

/**
 * Creates a payment instruction object for different payment methods
 */
export interface PaymentInstruction {
  type: "VA" | "QRIS" | "EWALLET" | "RETAIL";
  displayText: string;
  copyableValue?: string;
  qrCodeUrl?: string;
  expiresAt?: Date;
}

export function createPaymentInstruction(
  paymentMethodName: string,
  vaNumber?: string,
  qrCodeUrl?: string,
  expiresAt?: Date
): PaymentInstruction {
  if (paymentMethodName.includes("Virtual Account")) {
    return {
      type: "VA",
      displayText: `Transfer ke nomor rekening: ${formatVirtualAccountNumber(vaNumber || "")}`,
      copyableValue: vaNumber,
      expiresAt,
    };
  } else if (paymentMethodName === "QRIS") {
    return {
      type: "QRIS",
      displayText: "Scan kode QR di bawah dengan aplikasi e-wallet Anda",
      qrCodeUrl,
      expiresAt,
    };
  } else if (
    ["GoPay", "OVO", "Dana", "LinkAja"].includes(paymentMethodName)
  ) {
    return {
      type: "EWALLET",
      displayText: `Lanjutkan pembayaran dengan ${paymentMethodName}`,
      expiresAt,
    };
  } else {
    return {
      type: "RETAIL",
      displayText: `Bayar di ${paymentMethodName}`,
      copyableValue: vaNumber,
      expiresAt,
    };
  }
}
