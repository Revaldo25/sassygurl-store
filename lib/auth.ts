import NextAuth, { CredentialsSignin } from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import Credentials from "next-auth/providers/credentials";
import { cookies } from "next/headers";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5009/api";

async function authFetch(endpoint: string, body: any) {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
  return data;
}

class CustomAuthError extends CredentialsSignin {
  code: string;
  constructor(message: string) {
    super(message);
    this.code = message;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  trustHost: true,
  basePath: "/api/auth",
  debug: true,
  useSecureCookies: false, // FORCE unsecure cookies so ngrok HTTPS doesn't mismatch with localhost HTTP
  session: { 
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 Days (Aligns with C# Jwt:ExpireDays)
  }, 
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
      checks: ["state"], // Bypass PKCE to fix ngrok cookie mismatches
    }),
    // ...(process.env.FACEBOOK_CLIENT_ID && !process.env.FACEBOOK_CLIENT_ID.includes("PLACEHOLDER") ? [
    //   Facebook({
    //     clientId: process.env.FACEBOOK_CLIENT_ID,
    //     clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    //     allowDangerousEmailAccountLinking: true,
    //   })
    // ] : []),
    Credentials({
      name: "SassyAuth",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: any) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          // Call ASP.NET Core API for login
          const response = await authFetch('/auth/login', {
            action: "login",
            method: "email",
            email: credentials.email,
            password: credentials.password
          });

          if (response.success && response.data) {
            const cookieStore = await cookies();
            cookieStore.set("auth_token", response.data.token, {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              maxAge: 30 * 24 * 60 * 60
            });

            return {
              id: response.data.userId,
              name: response.data.name,
              email: credentials.email,
              role: response.data.role, 
              apiToken: response.data.token,
            };
          }
          // Backend returned success:false — throw CustomAuthError
          throw new CustomAuthError(response.message || "Login gagal.");
        } catch (error: any) {
          if (error instanceof CustomAuthError) throw error;
          console.error("NextAuth Authorize Error:", error.message);
          throw new CustomAuthError(error.message || "Kesalahan konfigurasi");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }: any) {
      if (user) {
        token.sub = user.id;
        token.role = user.role || "MEMBER";
        token.apiToken = user.apiToken;
        
        // For Google/Facebook (Social Logins)
        if (account?.provider === "google" || account?.provider === "facebook") {
            try {
              const response = await authFetch('/auth/social-login', {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                email: user.email,
                name: user.name
              });
              
              if (response.success && response.data) {
                token.role = response.data.role;
                token.apiToken = response.data.token;
              }
            } catch (err) {
              console.error("Social sync error:", err);
            }
        }
      }
      return token;
    },
    async session({ session, token }: any) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
        // @ts-ignore
        session.user.role = token.role;
        // @ts-ignore
        session.user.apiToken = token.apiToken;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
});