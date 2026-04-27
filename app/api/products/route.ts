import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { games, getSelectedPrice } from "@/lib/catalog";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        game: true,
        provider: true,
      },
      orderBy: [
        { game: { sortOrder: "asc" } },
        { sortOrder: "asc" },
        { name: "asc" },
      ],
    });

    return NextResponse.json({
      ok: true,
      source: "prisma",
      count: products.length,
      products,
    });
  } catch (error) {
    const fallback = games.flatMap((game) =>
      game.products.map((product) => ({
        sku: product.sku,
        name: product.name,
        game: { slug: game.slug, name: game.name },
        provider: { name: "Catalog", },
        priceModal: getSelectedPrice(product),
        image: product.image,
      }))
    );

    return NextResponse.json({
      ok: false,
      source: "fallback",
      error: "Gagal ambil data dari database",
      products: fallback,
    });
  }
}
