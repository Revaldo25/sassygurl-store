import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { jwtVerify } from "jose"

export default auth(async (req) => {
  const nextAuthSession = req.auth;
  const csharpToken = req.cookies.get("auth_token")?.value;
  
  const isLoggedIn = !!nextAuthSession || !!csharpToken;
  
  // Extract role
  let role = "MEMBER";
  
  if ((nextAuthSession?.user as any)?.role) {
    role = (nextAuthSession?.user as any).role;
  } else if (csharpToken) {
    try {
      // Decode and VERIFY C# JWT payload at the edge
      const rawSecret = process.env.JWT_SECRET || process.env.AUTH_SECRET;
      if (!rawSecret) throw new Error("Missing JWT_SECRET in environment variables");
      const secret = new TextEncoder().encode(rawSecret);
      const { payload } = await jwtVerify(csharpToken, secret);
      
      role = (payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] as string) || 
             (payload.role as string) || 
             "MEMBER";
    } catch (e) {
      console.error("Failed to verify C# JWT token at edge", e);
      // Don't trust the token if signature verification fails
    }
  }

  const roleUpper = role.toUpperCase();
  const isAdminOrOwner = ["SUPERADMIN", "ADMIN", "FINANCE", "CS", "OWNER"].includes(roleUpper);

  const path = req.nextUrl.pathname;
  const isAuthPage = path.startsWith("/auth");
  const isDashboardPage = path.startsWith("/dashboard");
  const isAdminRoute = path.startsWith("/admin");

  // Protect Admin routes
  if (isAdminRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/auth/login", req.nextUrl));
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
    if (isAdminOrOwner) {
      return NextResponse.redirect(new URL("/admin", req.nextUrl));
    }
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }
})

export const config = {
  matcher: ["/dashboard/:path*", "/auth/:path*", "/admin/:path*", "/member/:path*"],
};