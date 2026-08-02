import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireOrgSession, UnauthorizedError } from "@/lib/session";

async function findOrgMeasurement(orgId: string, measurementId: string) {
  return prisma.takeoffMeasurement.findFirst({
    where: { id: measurementId, document: { project: { organizationId: orgId } } },
  });
}

const patchSchema = z.object({
  label: z.string().trim().min(1).max(120).optional(),
  color: z.string().trim().min(1).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { orgId } = await requireOrgSession();
    const { id } = await params;
    const measurement = await findOrgMeasurement(orgId, id);
    if (!measurement) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = patchSchema.parse(await request.json());
    const updated = await prisma.takeoffMeasurement.update({ where: { id }, data: body });
    return NextResponse.json({ measurement: updated });
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    throw err;
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { orgId } = await requireOrgSession();
    const { id } = await params;
    const measurement = await findOrgMeasurement(orgId, id);
    if (!measurement) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.takeoffMeasurement.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    throw err;
  }
}
