import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const data = await req.formData();
    const file: File | null = data.get("file") as unknown as File;

    if (!file) {
      return NextResponse.json({ success: false, message: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'png';
    const uniqueFilename = `${crypto.randomBytes(8).toString('hex')}_${Date.now()}.${ext}`;
    
    // Save to public/images/games
    const uploadDir = path.join(process.cwd(), "public", "images", "games");
    const filepath = path.join(uploadDir, uniqueFilename);
    await writeFile(filepath, buffer);

    const publicUrl = `/images/games/${uniqueFilename}`;

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
