import type { NextAuthConfig } from "next-auth";

// Edge-safe config: no providers that touch Prisma/bcrypt, so this can be
// used directly in middleware (which runs on the Edge runtime).
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    jwt: ({ token }) => token,
    session: ({ session, token }) => {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.orgId = token.orgId as string | undefined;
        session.user.orgName = token.orgName as string | undefined;
        session.user.orgSlug = token.orgSlug as string | undefined;
        session.user.role = token.role as string | undefined;
      }
      return session;
    },
  },
};
