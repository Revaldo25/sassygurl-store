import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const memberId = cookieStore.get("sassy_member_session")?.value;

    if (!memberId) return NextResponse.json({ success: false });

    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: {
        transactions: {
          include: { product: { include: { category: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!member) return NextResponse.json({ success: false });

    return NextResponse.json({ success: true, member });
  } catch (error) {
    return NextResponse.json({ success: false });
  }
}