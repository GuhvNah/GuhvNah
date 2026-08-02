import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOrgSession } from "@/lib/session";
import { updateClient, deleteClient } from "@/lib/actions/clients";
import { ClientForm } from "@/components/client-form";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PROJECT_STATUS_LABELS } from "@/lib/constants";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { orgId } = await requireOrgSession();

  const client = await prisma.client.findFirst({
    where: { id, organizationId: orgId },
    include: { projects: { orderBy: { createdAt: "desc" } } },
  });

  if (!client) notFound();

  const updateWithId = updateClient.bind(null, client.id);
  const deleteWithId = deleteClient.bind(null, client.id);

  return (
    <div className="mx-auto max-w-xl px-6 py-8">
      <h1 className="text-xl font-semibold text-slate-900">{client.name}</h1>

      <Card className="mt-6">
        <CardHeader>
          <h2 className="text-sm font-medium text-slate-700">Client details</h2>
        </CardHeader>
        <CardBody>
          <ClientForm action={updateWithId} client={client} />
        </CardBody>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <h2 className="text-sm font-medium text-slate-700">Projects</h2>
        </CardHeader>
        <CardBody>
          {client.projects.length === 0 ? (
            <p className="text-sm text-slate-500">No projects for this client yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {client.projects.map((project) => (
                <li key={project.id} className="flex items-center justify-between py-2">
                  <Link href={`/projects/${project.id}`} className="text-blue-700 hover:underline">
                    {project.name}
                  </Link>
                  <span className="text-xs text-slate-500">{PROJECT_STATUS_LABELS[project.status]}</span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <form action={deleteWithId} className="mt-6">
        <Button type="submit" variant="danger" size="sm">
          Delete client
        </Button>
      </form>
    </div>
  );
}
