import type { NextAuthConfig } from "next-auth";

/**
 * Config "edge-safe": usada pelo middleware (Edge runtime), por isso não
 * pode importar nada que dependa de driver de banco em Node.js (o cliente
 * principal usa WebSocket via `@neondatabase/serverless` Pool, que só roda
 * em runtime Node.js). Aqui só decidimos redirecionamento com base no
 * cookie de sessão já existente — nenhuma query ao banco acontece aqui.
 */
export const authConfig = {
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isLoginPage = request.nextUrl.pathname === "/login";

      if (isLoginPage) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/dashboard", request.nextUrl));
        }
        return true;
      }

      return isLoggedIn;
    },
  },
} satisfies NextAuthConfig;
