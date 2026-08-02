"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireOrgSession } from "@/lib/session";

const PROJECT_STATUSES = [
  "LEAD",
  "TAKEOFF_IN_PROGRESS",
  "QUOTED",
  "WON",
  "LOST",
  "ARCHIVED",
] as const;

const projectSchema = z.object({
  name: z.string().trim().min(1, "Project name is required"),
  clientId: z.string().trim().optional(),
  siteAddress: z.string().trim().optional(),
  suburb: z.string().trim().optional(),
  postcode: z.string().trim().optional(),
  status: z.enum(PROJECT_STATUSES).default("LEAD"),
  description: z.string().trim().optional(),
});

function readProjectForm(formData: FormData) {
  return projectSchema.parse({
    name: formData.get("name"),
    clientId: formData.get("clientId") || undefined,
    siteAddress: formData.get("siteAddress") || undefined,
    suburb: formData.get("suburb") || undefined,
    postcode: formData.get("postcode") || undefined,
    status: formData.get("status") || "LEAD",
    description: formData.get("description") || undefined,
  });
}

export async function createProject(formData: FormData) {
  const { orgId } = await requireOrgSession();
  const data = readProjectForm(formData);

  const project = await prisma.project.create({
    data: {
      ...data,
      clientId: data.clientId || null,
      organizationId: orgId,
    },
  });

  revalidatePath("/projects");
  redirect(`/projects/${project.id}`);
}

export async function updateProject(projectId: string, formData: FormData) {
  const { orgId } = await requireOrgSession();
  const data = readProjectForm(formData);

  await prisma.project.updateMany({
    where: { id: projectId, organizationId: orgId },
    data: { ...data, clientId: data.clientId || null },
  });

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
}

export async function deleteProject(projectId: string) {
  const { orgId } = await requireOrgSession();
  await prisma.project.deleteMany({ where: { id: projectId, organizationId: orgId } });
  revalidatePath("/projects");
  redirect("/projects");
}
