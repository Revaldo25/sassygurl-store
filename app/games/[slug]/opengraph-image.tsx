import { ImageResponse } from 'next/og';
import gamesRegistry from '@/shared/registry/games_registry.json';

export const alt = 'SassyGurl Store - Top Up Game Termurah';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = gamesRegistry.find(g => g.slug === slug);

  if (!game) {
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 48,
            background: 'linear-gradient(to bottom, #0f172a, #020617)',
            color: 'white',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'sans-serif',
          }}
        >
          SassyGurl Store
        </div>
      ),
      { ...size }
    );
  }

  // Next.js metadata resolution context
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sassygurlstore.com';
  // Use a default banner since games_registry doesn't store bannerUrl
  const coverUrl = null;
  
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          backgroundColor: '#020617',
        }}
      >
        {/* Background Image with Overlay */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex' }}>
          {coverUrl && (
            <img 
              src={coverUrl}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              alt="Background"
            />
          )}
          <div style={{ 
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
            background: 'linear-gradient(to right, rgba(2,6,23,0.95) 0%, rgba(2,6,23,0.8) 50%, rgba(2,6,23,0.4) 100%)' 
          }} />
        </div>

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px', height: '100%', zIndex: 10 }}>
          <div style={{ color: '#db2777', fontSize: 32, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '24px' }}>
            SASSYGURL STORE
          </div>
          
          <div style={{ color: 'white', fontSize: 72, fontWeight: 900, lineHeight: 1.1, marginBottom: '24px', maxWidth: '700px', display: 'flex' }}>
            Top Up {game.display_title} Termurah
          </div>
          
          <div style={{ color: '#94a3b8', fontSize: 36, fontWeight: 500, display: 'flex' }}>
            Proses Otomatis 1-3 Detik • 100% Legal & Aman
          </div>

          <div style={{ display: 'flex', marginTop: '64px', alignItems: 'center' }}>
            <div style={{ background: 'linear-gradient(to right, #ec4899, #8b5cf6)', padding: '16px 48px', borderRadius: '100px', color: 'white', fontSize: 32, fontWeight: 700, display: 'flex' }}>
              Top Up Sekarang
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
