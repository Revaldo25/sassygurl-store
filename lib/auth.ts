// lib/auth.ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import Credentials from "next-auth/providers/credentials";
import { fetchApi } from "./api-client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // No more Prisma Adapter - we rely entirely on ASP.NET Core for database operations
  session: { strategy: "jwt" }, 
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    }),
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
          const response = await fetchApi<any>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({
              action: "login",
              method: "email",
              email: credentials.email,
              password: credentials.password
            })
          });

          if (response.success && response.data) {
            return {
              id: response.data.userId,
              name: response.data.name,
              email: credentials.email,
              role: response.data.role, 
            };
          }
          return null;
        } catch (error) {
          console.error("NextAuth Authorize Error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }: any) {
      if (user) {
        token.sub = user.id;
        token.role = user.role || "MEMBER";
        
        // For Google/Facebook (Social Logins)
        // In a real app, you would send this to C# API to sync the user
        if (account?.provider === "google" || account?.provider === "facebook") {
            // Simulated role for social logins
            token.role = "MEMBER";
        }
      }
      return token;
    },
    async session({ session, token }: any) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
        // @ts-ignore
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
});