import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const nextAuthSession = req.auth;
  // Also check for our custom C# token cookie used by /admin/login
  const csharpToken = req.cookies.get("auth_token")?.value;
  
  const isLoggedIn = !!nextAuthSession || !!csharpToken;
  
  // Extract role if available
  // @ts-ignore
  const role = nextAuthSession?.user?.role || (csharpToken ? "ADMIN" : "MEMBER"); // simplistic fallback if csharpToken exists

  const isAuthPage = req.nextUrl.pathname.startsWith("/auth") || req.nextUrl.pathname.startsWith("/admin/login");
  const isDashboardPage = req.nextUrl.pathname.startsWith("/dashboard");
  const isAdminPage = req.nextUrl.pathname.startsWith("/admin") && !req.nextUrl.pathname.startsWith("/admin/login");

  // Protect Member Dashboard
  if (isDashboardPage && !isLoggedIn) {
    return NextResponse.redirect(new URL("/auth/login", req.nextUrl));
  }

  // Protect Admin Dashboard
  if (isAdminPage) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/admin/login", req.nextUrl));
    }
    // Simplistic check: If only NextAuth is present and role is MEMBER, block access
    if (nextAuthSession && !csharpToken && role === "MEMBER") {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }
  }

  // Redirect away from login if already logged in
  if (isAuthPage && isLoggedIn) {
    if (isAdminPage || csharpToken) {
        return NextResponse.redirect(new URL("/admin", req.nextUrl));
    }
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }
})

export const config = {
  matcher: ["/dashboard/:path*", "/auth/:path*", "/admin/:path*"],
};