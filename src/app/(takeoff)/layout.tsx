import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function TakeoffLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.orgId) {
    redirect("/login");
  }
  return children;
}
