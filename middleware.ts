import { auth } from "@/lib/auth"

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith("/auth");
  const isDashboardPage = req.nextUrl.pathname.startsWith("/dashboard");

  // Jika belum login dan coba masuk dashboard, lempar ke login
  if (isDashboardPage && !isLoggedIn) {
    return Response.redirect(new URL("/auth/login", req.nextUrl));
  }

  // Jika sudah login tapi coba masuk halaman login/register lagi, lempar ke dashboard
  if (isAuthPage && isLoggedIn) {
    return Response.redirect(new URL("/dashboard", req.nextUrl));
  }
})

export const config = {
  matcher: ["/dashboard/:path*", "/auth/:path*"],
};