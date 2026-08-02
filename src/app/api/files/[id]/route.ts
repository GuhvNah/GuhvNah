import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrgSession, UnauthorizedError } from "@/lib/session";
import { readUpload } from "@/lib/storage";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { orgId } = await requireOrgSession();
    const { id } = await params;

    const document = await prisma.takeoffDocument.findFirst({
      where: { id, project: { organizationId: orgId } },
    });
    if (!document) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const buffer = await readUpload(document.fileUrl);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${document.name.replace(/"/g, "")}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    throw err;
  }
}
