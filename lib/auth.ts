import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import { env, hasGoogleAuth } from "@/lib/env";
import { ensureAllowlistSchema, getAccessFlags } from "@/lib/db";

const providers = [];

if (hasGoogleAuth()) {
  providers.push(
    GoogleProvider({
      clientId: env.googleClientId,
      clientSecret: env.googleClientSecret,
    }),
  );
}

export const authOptions: NextAuthOptions = {
  secret: env.authSecret,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers,
  callbacks: {
    async signIn({ user }) {
      await ensureAllowlistSchema();
      return Boolean(user.email);
    },
    async jwt({ token }) {
      const flags = await getAccessFlags(token.email);
      token.isAllowed = flags.isAllowed;
      token.isAdmin = flags.isAdmin;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email ?? session.user.email ?? "";
        session.user.isAllowed = Boolean(token.isAllowed);
        session.user.isAdmin = Boolean(token.isAdmin);
      }

      return session;
    },
  },
};

export function getServerAuthSession() {
  return getServerSession(authOptions);
}

