"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireOrgSession } from "@/lib/session";

const costItemSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  unit: z.string().trim().min(1, "Unit is required"),
  unitRate: z.coerce.number().min(0, "Rate must be positive"),
  category: z.string().trim().optional(),
});

export async function createCostItem(formData: FormData) {
  const { orgId } = await requireOrgSession();
  const data = costItemSchema.parse({
    name: formData.get("name"),
    unit: formData.get("unit"),
    unitRate: formData.get("unitRate"),
    category: formData.get("category") || undefined,
  });

  await prisma.costItem.create({ data: { ...data, organizationId: orgId } });
  revalidatePath("/settings/cost-items");
}

export async function deleteCostItem(costItemId: string) {
  const { orgId } = await requireOrgSession();
  await prisma.costItem.deleteMany({ where: { id: costItemId, organizationId: orgId } });
  revalidatePath("/settings/cost-items");
}
