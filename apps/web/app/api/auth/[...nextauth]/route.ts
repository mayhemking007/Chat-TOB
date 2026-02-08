import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID ?? "",
      clientSecret: process.env.GITHUB_SECRET ?? "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) return null;
          const res = await fetch(`${apiUrl}/auth/credentials`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });
          if (!res.ok) return null;
          const text = await res.text();
          if (!text.trim()) return null;
          const user = JSON.parse(text) as { id: string; email?: string; name?: string | null };
          return user?.id ? { id: user.id, email: user.email, name: user.name } : null;
        } catch {
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt" as const, maxAge: 30 * 24 * 60 * 60 },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email ?? undefined;
        token.name = user.name ?? undefined;
        return token;
      }
      if (
        account?.provider &&
        account.provider !== "credentials" &&
        profile &&
        !token.sub
      ) {
        const res = await fetch(`${apiUrl}/auth/oauth-user`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: (profile as { email?: string }).email ?? token.email,
            name: (profile as { name?: string }).name ?? token.name,
          }),
        });
        if (res.ok) {
          const text = await res.text();
          if (text.trim()) {
            try {
              const dbUser = JSON.parse(text) as { id: string; email: string; name?: string | null };
              if (dbUser.id) {
                token.sub = dbUser.id;
                token.email = dbUser.email;
                token.name = dbUser.name ?? undefined;
              }
            } catch {
              // ignore parse error
            }
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.email = token.email ?? "";
        session.user.name = token.name ?? null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

const nextAuthHandler = NextAuth(authOptions);

export async function GET(req: Request, context: unknown) {
  try {
    return await nextAuthHandler(req, context as any);
  } catch (e) {
    console.error("[NextAuth] GET error:", e);
    return new Response(
      JSON.stringify({ error: "Authentication error", message: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function POST(req: Request, context: unknown) {
  try {
    return await nextAuthHandler(req, context as any);
  } catch (e) {
    console.error("[NextAuth] POST error:", e);
    return new Response(
      JSON.stringify({ error: "Authentication error", message: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
