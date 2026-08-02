"use client";

import dynamic from "next/dynamic";
import type { MeasurementDTO } from "./types";

const TakeoffWorkspace = dynamic(() => import("./workspace").then((m) => m.TakeoffWorkspace), {
  ssr: false,
  loading: () => <div className="p-6 text-sm text-slate-500">Loading takeoff workspace...</div>,
});

export function TakeoffWorkspaceLoader(props: {
  documentId: string;
  projectId: string;
  projectName: string;
  documentName: string;
  fileUrl: string;
  initialMeasurements: MeasurementDTO[];
}) {
  return <TakeoffWorkspace {...props} />;
}
