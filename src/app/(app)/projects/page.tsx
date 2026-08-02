import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireOrgSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PROJECT_STATUS_COLORS, PROJECT_STATUS_LABELS } from "@/lib/constants";

export default async function ProjectsPage() {
  const { orgId } = await requireOrgSession();
  const projects = await prisma.project.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
    include: { client: true },
  });

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Projects</h1>
          <p className="mt-1 text-sm text-slate-500">Jobs you&apos;re taking off and quoting.</p>
        </div>
        <Link href="/projects/new">
          <Button>
            <Plus className="h-4 w-4" /> New project
          </Button>
        </Link>
      </div>

      <Card className="mt-6">
        {projects.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">
            No projects yet. Create your first project to start a takeoff.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Project</th>
                <th className="px-5 py-3 font-medium">Client</th>
                <th className="px-5 py-3 font-medium">Suburb</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projects.map((project) => (
                <tr key={project.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <Link href={`/projects/${project.id}`} className="font-medium text-blue-700 hover:underline">
                      {project.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{project.client?.name || "—"}</td>
                  <td className="px-5 py-3 text-slate-600">{project.suburb || "—"}</td>
                  <td className="px-5 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2 py-1 text-xs font-medium",
                        PROJECT_STATUS_COLORS[project.status],
                      )}
                    >
                      {PROJECT_STATUS_LABELS[project.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
