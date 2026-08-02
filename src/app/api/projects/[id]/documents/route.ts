import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrgSession, UnauthorizedError } from "@/lib/session";
import { saveUpload } from "@/lib/storage";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { orgId } = await requireOrgSession();
    const { id: projectId } = await params;

    const project = await prisma.project.findFirst({ where: { id: projectId, organizationId: orgId } });
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const documents = await prisma.takeoffDocument.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ documents });
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    throw err;
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { orgId } = await requireOrgSession();
    const { id: projectId } = await params;

    const project = await prisma.project.findFirst({ where: { id: projectId, organizationId: orgId } });
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF plans are supported" }, { status: 400 });
    }
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "File is too large (50MB max)" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const relativePath = await saveUpload(orgId, projectId, file.name, buffer);

    const document = await prisma.takeoffDocument.create({
      data: {
        name: file.name,
        fileUrl: relativePath,
        projectId,
      },
    });

    if (project.status === "LEAD") {
      await prisma.project.update({ where: { id: projectId }, data: { status: "TAKEOFF_IN_PROGRESS" } });
    }

    return NextResponse.json({ document }, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    throw err;
  }
}
