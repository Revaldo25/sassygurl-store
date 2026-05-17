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
  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin") && !req.nextUrl.pathname.startsWith("/admin/login");
  const isMemberRoute = req.nextUrl.pathname.startsWith("/member");

  if (isMemberRoute || isAdminRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
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