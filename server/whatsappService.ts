import axios from "axios";

export interface WhatsAppMessage {
  phoneNumber: string;
  message: string;
  productName: string;
  orderId: string;
  orderAmount: number;
}

export class WhatsAppService {
  private apiUrl: string;
  private apiKey: string;

  constructor(apiUrl?: string, apiKey?: string) {
    // In production, use environment variables
    // For now, use placeholder values
    this.apiUrl = apiUrl || process.env.WHATSAPP_API_URL || "https://api.fonnte.com/send";
    this.apiKey = apiKey || process.env.WHATSAPP_API_KEY || "your-api-key";
  }

  /**
   * Send WhatsApp notification after successful payment
   * Format: "Pesanan [PRODUCT_NAME] kamu sudah masuk! Cek akun ya!"
   */
  async sendPaymentConfirmation(data: WhatsAppMessage): Promise<boolean> {
    try {
      const message = this.formatPaymentMessage(data);

      console.log(`[WhatsApp] Sending message to ${data.phoneNumber}`);
      console.log(`[WhatsApp] Message: ${message}`);

      // In production, uncomment this to send real WhatsApp messages
      /*
      const response = await axios.post(
        this.apiUrl,
        {
          target: data.phoneNumber,
          message: message,
        },
        {
          headers: {
            Authorization: this.apiKey,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        console.log(`[WhatsApp] Message sent successfully to ${data.phoneNumber}`);
        return true;
      }
      */

      // For development, simulate success
      console.log(`[WhatsApp] (SIMULATED) Message sent to ${data.phoneNumber}`);
      return true;
    } catch (error) {
      console.error("[WhatsApp] Error sending message:", error);
      return false;
    }
  }

  /**
   * Format payment confirmation message
   * Example: "Pesanan Mobile Legends - 500 Diamonds kamu sudah masuk! Cek akun ya!"
   */
  private formatPaymentMessage(data: WhatsAppMessage): string {
    return `Pesanan ${data.productName} kamu sudah masuk! Cek akun ya!\n\nDetail Pesanan:\nID: ${data.orderId}\nJumlah: Rp ${data.orderAmount.toLocaleString("id-ID")}\n\nTerima kasih telah berbelanja di SassyGurl! 🎮✨`;
  }

  /**
   * Send order status update via WhatsApp
   */
  async sendOrderStatusUpdate(
    phoneNumber: string,
    orderId: string,
    status: "PENDING" | "CONFIRMED" | "FAILED"
  ): Promise<boolean> {
    try {
      let message = "";

      switch (status) {
        case "CONFIRMED":
          message = `✅ Pesanan #${orderId} telah dikonfirmasi!\n\nGames kamu sudah siap. Cek akun sekarang!`;
          break;
        case "PENDING":
          message = `⏳ Pesanan #${orderId} sedang diproses...\n\nKami akan segera mengirim games kamu.`;
          break;
        case "FAILED":
          message = `❌ Pesanan #${orderId} gagal diproses.\n\nSilakan hubungi customer service kami untuk bantuan.`;
          break;
      }

      console.log(`[WhatsApp] Sending status update to ${phoneNumber}`);
      console.log(`[WhatsApp] Message: ${message}`);

      // In production, send via API
      // For development, simulate success
      return true;
    } catch (error) {
      console.error("[WhatsApp] Error sending status update:", error);
      return false;
    }
  }

  /**
   * Send promotional message
   */
  async sendPromotion(
    phoneNumber: string,
    promoTitle: string,
    discount: number,
    expiresAt: Date
  ): Promise<boolean> {
    try {
      const message = `🎉 Promo Spesial SassyGurl!\n\n${promoTitle}\nDiskon: ${discount}%\nBerlaku hingga: ${expiresAt.toLocaleDateString("id-ID")}\n\nJangan lewatkan! Beli sekarang 🛍️`;

      console.log(`[WhatsApp] Sending promo to ${phoneNumber}`);
      console.log(`[WhatsApp] Message: ${message}`);

      // In production, send via API
      return true;
    } catch (error) {
      console.error("[WhatsApp] Error sending promo:", error);
      return false;
    }
  }
}

// Export singleton instance
export const whatsappService = new WhatsAppService();
