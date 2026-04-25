import nodemailer from "nodemailer";

export const sendOTP = async (email: string, otp: string) => {
  // Gunakan GMAIL atau layanan SMTP lainnya
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER, // Alamat Gmail Anda
      pass: process.env.EMAIL_PASS, // App Password Gmail (bukan password login)
    },
  });

  const mailOptions = {
    from: '"SassyGurl Security" <noreply@sassygurlstore.com>',
    to: email,
    subject: "Kode Verifikasi SassyGurlStore 🔐",
    html: `
      <div style="font-family: sans-serif; padding: 20px; background: #05050a; color: white; border-radius: 15px;">
        <h2 style="color: #ec4899;">Halo Pelanggan SassyGurl!</h2>
        <p>Gunakan kode OTP di bawah ini untuk memverifikasi akun Anda:</p>
        <div style="font-size: 2rem; font-weight: 900; letter-spacing: 5px; color: #ec4899; margin: 20px 0;">
          ${otp}
        </div>
        <p style="font-size: 0.8rem; color: #94a3b8;">Kode ini berlaku selama 10 menit. Jangan bagikan kode ini kepada siapapun.</p>
      </div>
    `,
  };

  return await transporter.sendMail(mailOptions);
};