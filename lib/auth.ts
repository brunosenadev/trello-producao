import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

import { authConfig } from "@/lib/auth.config";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

const CONTRATANTE_EMAIL = process.env.CONTRATANTE_EMAIL?.toLowerCase();
const FUNCIONARIO_EMAIL = process.env.FUNCIONARIO_EMAIL?.toLowerCase();

/**
 * Só existem duas pessoas usando o sistema. Em vez de um fluxo de convite/
 * cadastro, o papel de cada uma é decidido por uma allowlist de e-mail em
 * variáveis de ambiente — simples e suficiente para o escopo atual.
 */
function roleForEmail(email: string): "CONTRATANTE" | "FUNCIONARIO" | null {
  const normalized = email.toLowerCase();
  if (CONTRATANTE_EMAIL && normalized === CONTRATANTE_EMAIL) return "CONTRATANTE";
  if (FUNCIONARIO_EMAIL && normalized === FUNCIONARIO_EMAIL) return "FUNCIONARIO";
  return null;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, profile }) {
      const email = user.email;
      if (!email) return false;

      const role = roleForEmail(email);
      if (!role) return false; // e-mail fora da allowlist: acesso negado

      const googleId = (profile?.sub as string | undefined) ?? user.id;
      if (!googleId) return false;

      const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);

      if (existing) {
        await db
          .update(users)
          .set({
            name: user.name ?? existing.name,
            image: user.image ?? existing.image,
            role,
          })
          .where(eq(users.id, existing.id));
      } else {
        await db.insert(users).values({
          googleId,
          email,
          name: user.name ?? email,
          image: user.image ?? null,
          role,
        });
      }

      return true;
    },
    async jwt({ token, user }) {
      // Só roda no login (quando `user` está presente) — depois disso o
      // userId/role já ficam persistidos no próprio JWT, evitando ida ao
      // banco a cada request.
      if (user?.email) {
        const [dbUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, user.email))
          .limit(1);
        if (dbUser) {
          token.userId = dbUser.id;
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.userId && token.role) {
        session.user.id = token.userId as string;
        session.user.role = token.role as "CONTRATANTE" | "FUNCIONARIO";
      }
      return session;
    },
  },
});
