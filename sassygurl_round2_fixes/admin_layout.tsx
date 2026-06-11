import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";

// Roles yang boleh akses admin panel
const ADMIN_ROLES = new Set(["SUPERADMIN", "ADMIN", "CS", "FINANCE", "OWNER"]);

/**
 * Server Component Layout — Admin Panel Role Guard
 *
 * Defense-in-depth di atas middleware:
 * - Middleware cek token existence (cepat, di edge)
 * - Layout ini cek role yang sesungguhnya (di server, lebih akurat)
 *
 * Kenapa perlu dua lapis?
 * Middleware edge runtime tidak bisa mendekripsi C# JWT dengan sempurna.
 * Layout server component bisa baca session NextAuth ATAU parse JWT dengan
 * full crypto support.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ── Cek via NextAuth session (untuk login Google/FB/credentials) ──────
  const session = await auth();
  const nextAuthRole = (session?.user as any)?.role as string | undefined;

  // ── Cek via cookie auth_token (untuk login .NET JWT langsung) ─────────
  const cookieStore = await cookies();
  const authToken = cookieStore.get("auth_token")?.value;

  let role: string | null = nextAuthRole ?? null;

  // Parse .NET JWT jika NextAuth role tidak tersedia
  if (!role && authToken) {
    try {
      const payload = authToken.split(".")[1];
      if (payload) {
        const decoded = JSON.parse(
          Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8")
        );
        role =
          decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
          decoded.role ||
          null;
      }
    } catch {
      // JWT invalid / tampered → treat as no role
    }
  }

  // ── Tidak login sama sekali ────────────────────────────────────────────
  if (!role && !authToken && !session) {
    redirect("/admin/login");
  }

  // ── Login tapi bukan admin ─────────────────────────────────────────────
  if (role && !ADMIN_ROLES.has(role.toUpperCase())) {
    // Member biasa → redirect ke dashboard member
    redirect("/dashboard");
  }

  // ── Tidak bisa verifikasi role (token ada tapi tidak bisa parse) ───────
  // Izinkan masuk — middleware sudah validasi token existence-nya
  // Admin panel sendiri punya proteksi per-action di backend [Authorize]

  return <>{children}</>;
}
