import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOrgSession } from "@/lib/session";
import { TakeoffWorkspaceLoader } from "@/components/takeoff/workspace-loader";
import type { MeasurementDTO } from "@/components/takeoff/types";
import type { Point } from "@/lib/geometry";

export default async function TakeoffDocumentPage({
  params,
}: {
  params: Promise<{ id: string; docId: string }>;
}) {
  const { id: projectId, docId } = await params;
  const { orgId } = await requireOrgSession();

  const document = await prisma.takeoffDocument.findFirst({
    where: { id: docId, projectId, project: { organizationId: orgId } },
    include: { project: true, measurements: true },
  });

  if (!document) notFound();

  const initialMeasurements: MeasurementDTO[] = document.measurements.map((m) => ({
    id: m.id,
    label: m.label,
    type: m.type,
    page: m.page,
    points: m.points as Point[],
    pixelsPerMetre: Number(m.pixelsPerMetre),
    quantity: Number(m.quantity),
    unit: m.unit,
    color: m.color,
  }));

  return (
    <TakeoffWorkspaceLoader
      documentId={document.id}
      projectId={projectId}
      projectName={document.project.name}
      documentName={document.name}
      fileUrl={`/api/files/${document.id}`}
      initialMeasurements={initialMeasurements}
    />
  );
}
