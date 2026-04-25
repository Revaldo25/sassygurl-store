"use client";
import Link from "next/link";

export default function HeroSection({ isDark }: { isDark: boolean }) {
  const theme = {
    primaryPink: '#ec4899',
    textMain: isDark ? '#F0F6FC' : '#111827',
    textMuted: isDark ? '#8B949E' : '#6B7280',
    borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(236,72,153,0.15)',
  };

  return (
    <section style={{ position: 'relative', paddingTop: '120px', paddingBottom: '80px', textAlign: 'center', overflow: 'hidden' }}>
      <div style={{ position: 'relative', zIndex: 10, maxWidth: '800px', margin: '0 auto', padding: '0 20px' }}>
        <div style={{ display: 'inline-block', padding: '8px 20px', background: isDark ? 'rgba(236,72,153,0.1)' : '#fdf2f8', border: `1px solid ${isDark ? 'rgba(236,72,153,0.3)' : '#fbcfe8'}`, borderRadius: '30px', color: theme.primaryPink, fontSize: '12px', fontWeight: 900, letterSpacing: '1.5px', marginBottom: '24px' }}>
          👑 THE EXCLUSIVE TOP-UP LOUNGE
        </div>
        
        <h1 style={{ fontSize: 'clamp(40px, 6vw, 64px)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-1.5px', marginBottom: '24px' }}>
          Elevate Your Game. <br />
          <span className="sassy-gradient-text">Zero Interruptions.</span>
        </h1>
        
        <p style={{ color: theme.textMuted, fontSize: 'clamp(14px, 2vw, 18px)', maxWidth: '600px', margin: '0 auto 40px', lineHeight: 1.6 }}>
          Top-up game tercepat se-Nusantara. Katalog super lengkap, dari game kompetitif PC hingga gacha RPG paling diminati saat ini.
        </p>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="#katalog" style={{ textDecoration: 'none' }}>
            <button style={{ padding: '16px 36px', background: theme.primaryPink, color: '#fff', fontSize: '14px', fontWeight: 800, border: 'none', borderRadius: '16px', cursor: 'pointer', boxShadow: '0 8px 25px rgba(236,72,153,0.4)', transition: '0.2s' }}>
              JELAJAHI KATALOG
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}