import { HelpCircle } from "lucide-react";

export default function FAQAccordion() {
  const faqs = [
    {
      q: "Berapa lama waktu proses top-up?",
      a: "Hampir seluruh transaksi diproses otomatis secara instan dalam 1-3 detik setelah pembayaran berhasil terverifikasi oleh gateway kami.",
    },
    {
      q: "Apakah top-up di SassyGurl Store aman?",
      a: "100% Aman dan Legal. Kami memproses seluruh pesanan melalui koneksi API provider resmi sehingga akun game Anda bebas dari risiko banned.",
    },
    {
      q: "Bagaimana cara melacak pesanan saya?",
      a: "Anda dapat memantau status transaksi secara real-time pada menu Cek Pesanan di navbar menggunakan nomor Invoice, atau melihat pesan WhatsApp otomatis yang dikirimkan sistem.",
    },
    {
      q: "Bagaimana jika salah memasukkan ID Akun?",
      a: "Pesanan diproses secara otomatis dan instan oleh sistem. Jika ID yang dimasukkan salah tetapi valid, item akan terkirim ke akun tersebut dan tidak dapat ditarik kembali. Pastikan melakukan double-check nickname Anda saat modal konfirmasi muncul.",
    },
    {
      q: "Metode pembayaran apa saja yang tersedia?",
      a: "Kami menyediakan berbagai pilihan pembayaran lengkap, mulai dari QRIS (Gopay, OVO, ShopeePay, DANA), Virtual Account (BCA, Mandiri, BNI, BRI), hingga minimarket Alfamart dan Indomaret.",
    },
  ];

  // Render JSON-LD schema for search engines (SEO best practices)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.a,
      },
    })),
  };

  return (
    <div className="rounded-[2rem] border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent p-6 shadow-2xl backdrop-blur-xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 mb-6 flex items-center gap-2">
        <HelpCircle className="w-4 h-4 text-sakura" />
        FAQ & Bantuan
      </h3>

      <div className="space-y-3">
        {faqs.map((faq, i) => (
          <details
            key={i}
            className="group rounded-2xl border border-white/5 bg-zinc-950/40 p-4 transition-all duration-300 open:border-sakura/20 open:bg-sakura/[0.02]"
          >
            <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-bold text-white/80 list-none select-none group-open:text-white">
              <span>{faq.q}</span>
              <span className="text-xs text-white/40 transition-transform duration-300 group-open:rotate-180 group-open:text-sakura">
                ▼
              </span>
            </summary>
            <div className="mt-3 text-xs leading-relaxed text-white/50 border-t border-white/5 pt-3 animate-[fadeInUp_0.2s_ease-out]">
              {faq.a}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
