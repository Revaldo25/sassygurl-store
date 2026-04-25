export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  // GANTI INI: Pakai string langsung dulu buat ngetes!
  const MY_SECRET_TOKEN = "SASSY_ELITE_SECURE_2026"; 

  if (mode === "subscribe" && token === MY_SECRET_TOKEN) {
    console.log("✅ Handshake Sukses!");
    // WAJIB: Balikkan challenge sebagai plain text
    return new Response(challenge, { status: 200 });
  }

  console.error("❌ Token Mismatch! Meta kirim:", token);
  return new Response("Forbidden", { status: 403 });
}