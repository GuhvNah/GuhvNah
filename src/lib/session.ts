import { auth } from "@/lib/auth";

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
  }
}

// For use in route handlers / server actions. Throws if there's no
// authenticated user with an organization membership.
export async function requireOrgSession() {
  const session = await auth();
  if (!session?.user?.orgId) {
    throw new UnauthorizedError();
  }
  return {
    userId: session.user.id,
    orgId: session.user.orgId,
    role: session.user.role,
  };
}
