import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("sassy_member_session")?.value;

    if (!sessionId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        balance: true,
        role: true
      }
    });

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}