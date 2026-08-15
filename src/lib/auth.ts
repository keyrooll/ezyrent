import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

/**
 * Auth.js v5 — credentials + JWT.
 * Role dan landlord_id disimpan dalam token supaya boleh dibaca
 * di server component / middleware tanpa query DB berulang.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  trustHost: true,
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-mel", type: "email" },
        password: { label: "Kata laluan", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").toLowerCase().trim();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || user.status !== "ACTIVE") return null;

        const sah = await bcrypt.compare(password, user.password_hash);
        if (!sah) return null;

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.landlordId = await cariLandlordId(user.id ?? "", user.role);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role ?? "TENANT";
        session.user.landlordId = token.landlordId ?? null;
      }
      return session;
    },
  },
});

/** Tentukan landlord_id pengguna ikut role mereka */
async function cariLandlordId(userId: string, role: string): Promise<string | null> {
  if (role === "SUPER_ADMIN") return null;
  if (role === "LANDLORD") {
    const l = await prisma.landlord.findUnique({ where: { owner_id: userId } });
    return l?.id ?? null;
  }
  if (role === "STAFF") {
    const s = await prisma.staff.findUnique({ where: { user_id: userId } });
    return s?.landlord_id ?? null;
  }
  if (role === "TENANT") {
    const t = await prisma.tenant.findUnique({ where: { user_id: userId } });
    return t?.landlord_id ?? null;
  }
  return null;
}
