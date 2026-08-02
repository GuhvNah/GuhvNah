import type { Point } from "@/lib/geometry";

export type MeasurementType = "LINEAR" | "AREA" | "COUNT";

export type MeasurementDTO = {
  id: string;
  label: string;
  type: MeasurementType;
  page: number;
  points: Point[];
  pixelsPerMetre: number;
  quantity: number;
  unit: string;
  color: string;
};
