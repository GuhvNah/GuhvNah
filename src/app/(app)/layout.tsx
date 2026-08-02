import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { NavShell } from "@/components/nav-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.orgId) {
    redirect("/login");
  }

  return (
    <NavShell orgName={session.user.orgName ?? "Your company"} userName={session.user.name ?? session.user.email ?? ""}>
      {children}
    </NavShell>
  );
}
