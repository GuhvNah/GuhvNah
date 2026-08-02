import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireOrgSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function ClientsPage() {
  const { orgId } = await requireOrgSession();
  const clients = await prisma.client.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { projects: true } } },
  });

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Clients</h1>
          <p className="mt-1 text-sm text-slate-500">Builders, developers and homeowners you quote for.</p>
        </div>
        <Link href="/clients/new">
          <Button>
            <Plus className="h-4 w-4" /> New client
          </Button>
        </Link>
      </div>

      <Card className="mt-6">
        {clients.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">
            No clients yet. Add your first client to start creating projects.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Contact</th>
                <th className="px-5 py-3 font-medium">Phone</th>
                <th className="px-5 py-3 font-medium">Projects</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <Link href={`/clients/${client.id}`} className="font-medium text-blue-700 hover:underline">
                      {client.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {client.contactName || client.email || "—"}
                  </td>
                  <td className="px-5 py-3 text-slate-600">{client.phone || "—"}</td>
                  <td className="px-5 py-3 text-slate-600">{client._count.projects}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
