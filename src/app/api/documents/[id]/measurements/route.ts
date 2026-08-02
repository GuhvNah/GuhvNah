import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireOrgSession, UnauthorizedError } from "@/lib/session";

async function findOrgDocument(orgId: string, documentId: string) {
  return prisma.takeoffDocument.findFirst({
    where: { id: documentId, project: { organizationId: orgId } },
  });
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { orgId } = await requireOrgSession();
    const { id } = await params;
    const document = await findOrgDocument(orgId, id);
    if (!document) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const measurements = await prisma.takeoffMeasurement.findMany({
      where: { documentId: id },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ measurements });
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    throw err;
  }
}

const pointSchema = z.object({ x: z.number(), y: z.number() });

const createSchema = z.object({
  label: z.string().trim().min(1).max(120),
  type: z.enum(["LINEAR", "AREA", "COUNT"]),
  page: z.number().int().min(1),
  points: z.array(pointSchema).min(1),
  pixelsPerMetre: z.number().positive(),
  quantity: z.number().nonnegative(),
  unit: z.string().trim().min(1),
  color: z.string().trim().min(1).default("#2563eb"),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { orgId } = await requireOrgSession();
    const { id } = await params;
    const document = await findOrgDocument(orgId, id);
    if (!document) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const data = createSchema.parse(await request.json());

    const measurement = await prisma.takeoffMeasurement.create({
      data: { ...data, points: data.points, documentId: id },
    });
    return NextResponse.json({ measurement }, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    throw err;
  }
}
