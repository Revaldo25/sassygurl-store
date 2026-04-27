# SassyGurl Store Ultra

Premium top-up storefront built with Next.js App Router, TypeScript, Tailwind CSS, Prisma, animated glassmorphism UI, and local assets.

## What is included

- `app/page.tsx` — luxury home experience
- `app/mlbb/page.tsx` — full MLBB checkout journey
- `components/` — reusable modular UI blocks
- `lib/catalog.ts` — single source of truth for games, products, pricing routes, and payment methods
- `prisma/seed.ts` — Prisma seed powered by the catalog
- `public/images/` — merged game assets and UI assets
- `public/media/` — hero loop video and click sound

## Data flow

`lib/catalog.ts` → UI components → API routes → Prisma seed

## Asset structure

- `public/images/hero`
- `public/images/games`
- `public/images/items`
- `public/images/ui`

## Notes

- MLBB is the primary polished experience.
- Smart provider routing is simulated in the catalog and persisted through seed data.
- Add new items by appending products to `lib/catalog.ts` and reseeding Prisma.
