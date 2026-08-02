export const PROJECT_STATUS_LABELS: Record<string, string> = {
  LEAD: "Lead",
  TAKEOFF_IN_PROGRESS: "Takeoff in progress",
  QUOTED: "Quoted",
  WON: "Won",
  LOST: "Lost",
  ARCHIVED: "Archived",
};

export const PROJECT_STATUS_COLORS: Record<string, string> = {
  LEAD: "bg-slate-100 text-slate-700",
  TAKEOFF_IN_PROGRESS: "bg-amber-100 text-amber-800",
  QUOTED: "bg-blue-100 text-blue-800",
  WON: "bg-green-100 text-green-800",
  LOST: "bg-red-100 text-red-800",
  ARCHIVED: "bg-slate-100 text-slate-500",
};

export const MEASUREMENT_UNITS: Record<"LINEAR" | "AREA" | "COUNT", string> = {
  LINEAR: "m",
  AREA: "m²",
  COUNT: "ea",
};

export const MEASUREMENT_COLORS = [
  "#2563eb",
  "#dc2626",
  "#16a34a",
  "#d97706",
  "#7c3aed",
  "#0891b2",
  "#db2777",
];
