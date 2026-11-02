import { compare } from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { ensureAuthSecret } from "@/lib/auth-secret";
import { prisma } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  secret: ensureAuthSecret(),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mật khẩu", type: "password" },
      },
      async authorize(credentials) {
        const email = typeof credentials?.email === "string" ? credentials.email.trim().toLowerCase() : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";
        if (!email || !password) return null;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;
        const matches = await compare(password, user.passwordHash);
        if (!matches) return null;
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user && typeof token.id === "string") {
        session.user.id = token.id;
      }
      return session;
    },
  },
};

export function auth() {
  return getServerSession(authOptions);
}
