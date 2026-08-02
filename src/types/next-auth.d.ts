import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      orgId?: string;
      orgName?: string;
      orgSlug?: string;
      role?: string;
    } & DefaultSession["user"];
  }
}
