import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const nextAuthSession = req.auth;
  const csharpToken = req.cookies.get("auth_token")?.value;
  
  const isLoggedIn = !!nextAuthSession || !!csharpToken;
  
  // Extract role
  let role = "MEMBER";
  
  if ((nextAuthSession?.user as any)?.role) {
    role = (nextAuthSession?.user as any).role;
  } else if (csharpToken) {
    // Decode C# JWT payload at the edge without verifying signature
    // Since NextAuth usually handles standard login, this is a fallback for direct C# auth.
    try {
      const payloadBase64 = csharpToken.split('.')[1];
      const decodedPayload = Buffer.from(payloadBase64, 'base64').toString('utf8');
      const json = JSON.parse(decodedPayload);
      role = json["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || json.role || "MEMBER";
    } catch (e) {
      console.error("Failed to decode C# JWT token at edge", e);
    }
  }

  const roleUpper = role.toUpperCase();
  const isAdminOrOwner = ["SUPERADMIN", "ADMIN", "FINANCE", "CS", "OWNER"].includes(roleUpper);

  const path = req.nextUrl.pathname;
  const isAuthPage = path.startsWith("/auth") || path.startsWith("/admin/login");
  const isDashboardPage = path.startsWith("/dashboard");
  const isAdminRoute = path.startsWith("/admin") && !path.startsWith("/admin/login");

  // Protect Admin routes
  if (isAdminRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/admin/login", req.nextUrl));
    }
    if (!isAdminOrOwner) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }
  }

  // Protect Dashboard
  if (isDashboardPage && !isLoggedIn) {
    return NextResponse.redirect(new URL("/auth/login", req.nextUrl));
  }

  // Redirect away from login if already logged in
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }
})

export const config = {
  matcher: ["/dashboard/:path*", "/auth/:path*", "/admin/:path*", "/member/:path*"],
};