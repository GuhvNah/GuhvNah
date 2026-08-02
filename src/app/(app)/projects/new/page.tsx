import { prisma } from "@/lib/prisma";
import { requireOrgSession } from "@/lib/session";
import { createProject } from "@/lib/actions/projects";
import { ProjectForm } from "@/components/project-form";
import { Card, CardBody, CardHeader } from "@/components/ui/card";

export default async function NewProjectPage() {
  const { orgId } = await requireOrgSession();
  const clients = await prisma.client.findMany({
    where: { organizationId: orgId },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-xl px-6 py-8">
      <h1 className="text-xl font-semibold text-slate-900">New project</h1>
      <Card className="mt-6">
        <CardHeader>
          <h2 className="text-sm font-medium text-slate-700">Project details</h2>
        </CardHeader>
        <CardBody>
          <ProjectForm action={createProject} clients={clients} submitLabel="Create project" />
        </CardBody>
      </Card>
    </div>
  );
}
