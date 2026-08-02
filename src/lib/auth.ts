import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name ?? undefined };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    jwt: async ({ token, user }) => {
      if (user?.id) {
        token.userId = user.id;
      }
      if (token.userId) {
        const membership = await prisma.membership.findFirst({
          where: { userId: token.userId as string },
          include: { organization: true },
          orderBy: { createdAt: "asc" },
        });
        if (membership) {
          token.orgId = membership.organizationId;
          token.orgName = membership.organization.name;
          token.orgSlug = membership.organization.slug;
          token.role = membership.role;
        }
      }
      return token;
    },
  },
});
