import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireOrgSession, UnauthorizedError } from "@/lib/session";
import { deleteUpload } from "@/lib/storage";

async function findOrgDocument(orgId: string, documentId: string) {
  return prisma.takeoffDocument.findFirst({
    where: { id: documentId, project: { organizationId: orgId } },
    include: { project: true },
  });
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { orgId } = await requireOrgSession();
    const { id } = await params;
    const document = await findOrgDocument(orgId, id);
    if (!document) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ document });
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    throw err;
  }
}

const patchSchema = z.object({
  pageCount: z.number().int().min(1).optional(),
  name: z.string().trim().min(1).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { orgId } = await requireOrgSession();
    const { id } = await params;
    const document = await findOrgDocument(orgId, id);
    if (!document) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = patchSchema.parse(await request.json());
    const updated = await prisma.takeoffDocument.update({ where: { id }, data: body });
    return NextResponse.json({ document: updated });
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    throw err;
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { orgId } = await requireOrgSession();
    const { id } = await params;
    const document = await findOrgDocument(orgId, id);
    if (!document) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.takeoffDocument.delete({ where: { id } });
    await deleteUpload(document.fileUrl);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    throw err;
  }
}
