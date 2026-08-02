import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireOrgSession } from "@/lib/session";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PROJECT_STATUS_COLORS, PROJECT_STATUS_LABELS } from "@/lib/constants";

export default async function DashboardPage() {
  const { orgId } = await requireOrgSession();

  const [projectCount, clientCount, activeProjects, recentProjects] = await Promise.all([
    prisma.project.count({ where: { organizationId: orgId } }),
    prisma.client.count({ where: { organizationId: orgId } }),
    prisma.project.count({
      where: { organizationId: orgId, status: { in: ["LEAD", "TAKEOFF_IN_PROGRESS", "QUOTED"] } },
    }),
    prisma.project.findMany({
      where: { organizationId: orgId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: { client: true },
    }),
  ]);

  const stats = [
    { label: "Active projects", value: activeProjects },
    { label: "Total projects", value: projectCount },
    { label: "Clients", value: clientCount },
  ];

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
        <Link href="/projects/new">
          <Button>New project</Button>
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardBody>
              <p className="text-sm text-slate-500">{stat.label}</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{stat.value}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardBody>
          <h2 className="mb-3 text-sm font-medium text-slate-700">Recent projects</h2>
          {recentProjects.length === 0 ? (
            <p className="text-sm text-slate-500">
              No projects yet. Create your first project to start a takeoff.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentProjects.map((project) => (
                <li key={project.id} className="flex items-center justify-between py-2">
                  <div>
                    <Link href={`/projects/${project.id}`} className="font-medium text-blue-700 hover:underline">
                      {project.name}
                    </Link>
                    <p className="text-xs text-slate-500">{project.client?.name || "No client"}</p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-1 text-xs font-medium",
                      PROJECT_STATUS_COLORS[project.status],
                    )}
                  >
                    {PROJECT_STATUS_LABELS[project.status]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
