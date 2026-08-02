import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireOrgSession } from "@/lib/session";
import { updateProject, deleteProject } from "@/lib/actions/projects";
import { ProjectForm } from "@/components/project-form";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DocumentUploader } from "@/components/document-uploader";
import { QuantitySummary, type QuantityGroup } from "@/components/quantity-summary";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { orgId } = await requireOrgSession();

  const [project, clients, costItems, organization] = await Promise.all([
    prisma.project.findFirst({
      where: { id, organizationId: orgId },
      include: { documents: { orderBy: { createdAt: "desc" } } },
    }),
    prisma.client.findMany({ where: { organizationId: orgId }, orderBy: { name: "asc" } }),
    prisma.costItem.findMany({ where: { organizationId: orgId }, orderBy: { name: "asc" } }),
    prisma.organization.findUnique({ where: { id: orgId } }),
  ]);

  if (!project) notFound();

  const measurements = await prisma.takeoffMeasurement.findMany({
    where: { document: { projectId: id } },
  });

  const groupMap = new Map<string, QuantityGroup>();
  for (const m of measurements) {
    const key = `${m.label}__${m.type}__${m.unit}`;
    const existing = groupMap.get(key);
    const quantity = Number(m.quantity);
    if (existing) {
      existing.quantity += quantity;
    } else {
      groupMap.set(key, { key, label: m.label, type: m.type, unit: m.unit, quantity });
    }
  }
  const groups = Array.from(groupMap.values()).sort((a, b) => a.label.localeCompare(b.label));

  const updateWithId = updateProject.bind(null, project.id);
  const deleteWithId = deleteProject.bind(null, project.id);

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">{project.name}</h1>
        <DocumentUploader projectId={project.id} />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <h2 className="text-sm font-medium text-slate-700">Plans</h2>
        </CardHeader>
        <CardBody>
          {project.documents.length === 0 ? (
            <p className="text-sm text-slate-500">
              No plans uploaded yet. Upload a PDF to start a takeoff.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {project.documents.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between py-2">
                  <Link
                    href={`/projects/${project.id}/documents/${doc.id}`}
                    className="flex items-center gap-2 text-blue-700 hover:underline"
                  >
                    <FileText className="h-4 w-4" />
                    {doc.name}
                  </Link>
                  <span className="text-xs text-slate-400">
                    {new Date(doc.createdAt).toLocaleDateString("en-AU")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <h2 className="text-sm font-medium text-slate-700">Quantity summary</h2>
        </CardHeader>
        <CardBody>
          <QuantitySummary
            groups={groups}
            costItems={costItems.map((c) => ({
              id: c.id,
              name: c.name,
              unit: c.unit,
              unitRate: Number(c.unitRate),
            }))}
            gstRate={organization ? Number(organization.gstRate) : 0.1}
          />
        </CardBody>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <h2 className="text-sm font-medium text-slate-700">Project details</h2>
        </CardHeader>
        <CardBody>
          <ProjectForm action={updateWithId} project={project} clients={clients} />
        </CardBody>
      </Card>

      <form action={deleteWithId} className="mt-6">
        <Button type="submit" variant="danger" size="sm">
          Delete project
        </Button>
      </form>
    </div>
  );
}
