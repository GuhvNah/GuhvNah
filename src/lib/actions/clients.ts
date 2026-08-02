"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireOrgSession } from "@/lib/session";

const clientSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  contactName: z.string().trim().optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

function readClientForm(formData: FormData) {
  return clientSchema.parse({
    name: formData.get("name"),
    contactName: formData.get("contactName") || undefined,
    email: formData.get("email") || "",
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined,
    notes: formData.get("notes") || undefined,
  });
}

export async function createClient(formData: FormData) {
  const { orgId } = await requireOrgSession();
  const data = readClientForm(formData);

  const client = await prisma.client.create({
    data: { ...data, email: data.email || null, organizationId: orgId },
  });

  revalidatePath("/clients");
  redirect(`/clients/${client.id}`);
}

export async function updateClient(clientId: string, formData: FormData) {
  const { orgId } = await requireOrgSession();
  const data = readClientForm(formData);

  await prisma.client.updateMany({
    where: { id: clientId, organizationId: orgId },
    data: { ...data, email: data.email || null },
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
}

export async function deleteClient(clientId: string) {
  const { orgId } = await requireOrgSession();
  await prisma.client.deleteMany({ where: { id: clientId, organizationId: orgId } });
  revalidatePath("/clients");
  redirect("/clients");
}
