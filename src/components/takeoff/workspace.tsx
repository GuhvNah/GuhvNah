"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Stage, Layer, Image as KonvaImage, Line, Circle, Text as KonvaText } from "react-konva";
import type Konva from "konva";
import {
  ArrowLeft,
  Hand,
  Ruler,
  Square,
  Hash,
  ZoomIn,
  ZoomOut,
  Maximize,
  Check,
  X,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { cn, formatNumber } from "@/lib/utils";
import { distance, flattenPoints, polygonArea, polylineLength, type Point } from "@/lib/geometry";
import { MEASUREMENT_COLORS, MEASUREMENT_UNITS } from "@/lib/constants";
import { usePdfDocument } from "./use-pdf-document";
import type { MeasurementDTO, MeasurementType } from "./types";

type Tool = "pan" | "calibrate" | "linear" | "area" | "count";

const TOOLS: { id: Tool; label: string; icon: typeof Hand }[] = [
  { id: "pan", label: "Pan", icon: Hand },
  { id: "calibrate", label: "Calibrate", icon: Ruler },
  { id: "linear", label: "Linear", icon: Ruler },
  { id: "area", label: "Area", icon: Square },
  { id: "count", label: "Count", icon: Hash },
];

export function TakeoffWorkspace({
  documentId,
  projectId,
  projectName,
  documentName,
  fileUrl,
  initialMeasurements,
}: {
  documentId: string;
  projectId: string;
  projectName: string;
  documentName: string;
  fileUrl: string;
  initialMeasurements: MeasurementDTO[];
}) {
  const { numPages, error: pdfError, renderPage } = usePdfDocument(fileUrl);

  const [page, setPage] = useState(1);
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [loadingPage, setLoadingPage] = useState(true);

  const [tool, setTool] = useState<Tool>("pan");
  const [draftPoints, setDraftPoints] = useState<Point[]>([]);
  const [cursorPos, setCursorPos] = useState<Point | null>(null);
  // Seed calibration for each page from its most recent measurement, so
  // re-opening a plan doesn't require re-calibrating every time.
  const [calibrationByPage, setCalibrationByPage] = useState<Record<number, number>>(() => {
    const seed: Record<number, number> = {};
    for (const m of initialMeasurements) {
      if (seed[m.page] === undefined) seed[m.page] = m.pixelsPerMetre;
    }
    return seed;
  });

  const [measurements, setMeasurements] = useState<MeasurementDTO[]>(initialMeasurements);
  const [label, setLabel] = useState("");
  const [color, setColor] = useState(MEASUREMENT_COLORS[0]);
  const [saving, setSaving] = useState(false);

  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState<Point>({ x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });

  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const updateSize = () =>
      setContainerSize({ width: container.clientWidth, height: container.clientHeight });
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const loadPage = useCallback(
    async (pageNumber: number) => {
      setLoadingPage(true);
      const result = await renderPage(pageNumber);
      if (result) {
        setBgImage(result.image);
        setImageSize({ width: result.width, height: result.height });

        const container = containerRef.current;
        if (container) {
          const fitScale = Math.min(
            (container.clientWidth - 24) / result.width,
            (container.clientHeight - 24) / result.height,
            1,
          );
          setStageScale(fitScale);
          setStagePos({
            x: (container.clientWidth - result.width * fitScale) / 2,
            y: 16,
          });
        }
      }
      setLoadingPage(false);
    },
    [renderPage],
  );

  useEffect(() => {
    // loadPage sets a loading flag before awaiting the PDF render; that's an
    // intentional immediate loading-state update, not a synchronization hazard.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (numPages > 0) loadPage(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numPages, page]);

  const resetDraft = () => {
    setDraftPoints([]);
    setCursorPos(null);
  };

  const changeTool = (next: Tool) => {
    setTool(next);
    resetDraft();
  };

  const pixelsPerMetre = calibrationByPage[page];

  const getRelativePoint = (): Point | null => {
    const stage = stageRef.current;
    if (!stage) return null;
    const pos = stage.getRelativePointerPosition();
    if (!pos) return null;
    return { x: pos.x, y: pos.y };
  };

  const finishCalibration = (points: Point[]) => {
    const pixelDist = distance(points[0], points[1]);
    const input = window.prompt(
      "Real-world distance between these two points, in metres (e.g. 5.4):",
    );
    if (input) {
      const metres = parseFloat(input);
      if (!Number.isNaN(metres) && metres > 0) {
        setCalibrationByPage((prev) => ({ ...prev, [page]: pixelDist / metres }));
      } else {
        window.alert("Enter a positive number of metres.");
      }
    }
    resetDraft();
  };

  const saveMeasurement = async (data: {
    type: MeasurementType;
    points: Point[];
    quantity: number;
    unit: string;
    ppm: number;
  }) => {
    setSaving(true);
    const res = await fetch(`/api/documents/${documentId}/measurements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: label.trim() || defaultLabelFor(data.type),
        type: data.type,
        page,
        points: data.points,
        pixelsPerMetre: data.ppm,
        quantity: data.quantity,
        unit: data.unit,
        color,
      }),
    });
    setSaving(false);
    if (res.ok) {
      const { measurement } = await res.json();
      setMeasurements((prev) => [...prev, measurement]);
    } else {
      const err = await res.json().catch(() => ({}));
      window.alert(err.error ?? "Failed to save measurement");
    }
  };

  const finishShape = async () => {
    if (tool === "linear" && draftPoints.length >= 2) {
      const ppm = pixelsPerMetre;
      if (!ppm) {
        window.alert("Calibrate this page first (Calibrate tool).");
        return;
      }
      const quantity = polylineLength(draftPoints) / ppm;
      await saveMeasurement({ type: "LINEAR", points: draftPoints, quantity, unit: "m", ppm });
      resetDraft();
    } else if (tool === "area" && draftPoints.length >= 3) {
      const ppm = pixelsPerMetre;
      if (!ppm) {
        window.alert("Calibrate this page first (Calibrate tool).");
        return;
      }
      const quantity = polygonArea(draftPoints) / (ppm * ppm);
      await saveMeasurement({ type: "AREA", points: draftPoints, quantity, unit: "m²", ppm });
      resetDraft();
    }
  };

  const onStageClick = async () => {
    const point = getRelativePoint();
    if (!point) return;

    if (tool === "pan") return;

    if (tool === "calibrate") {
      const next = [...draftPoints, point];
      setDraftPoints(next);
      if (next.length === 2) finishCalibration(next);
      return;
    }

    if (tool === "count") {
      await saveMeasurement({
        type: "COUNT",
        points: [point],
        quantity: 1,
        unit: "ea",
        ppm: pixelsPerMetre ?? 1,
      });
      return;
    }

    // linear / area
    setDraftPoints((prev) => [...prev, point]);
  };

  const onStageDblClick = () => {
    if (tool === "linear" || tool === "area") finishShape();
  };

  const onMouseMove = () => {
    if (tool !== "linear" && tool !== "area") return;
    const point = getRelativePoint();
    if (point) setCursorPos(point);
  };

  const onWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const oldScale = stageScale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stagePos.x) / oldScale,
      y: (pointer.y - stagePos.y) / oldScale,
    };
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = Math.max(0.1, Math.min(4, oldScale * (direction > 0 ? 1.1 : 0.9)));

    setStageScale(newScale);
    setStagePos({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  const zoomBy = (factor: number) => {
    setStageScale((s) => Math.max(0.1, Math.min(4, s * factor)));
  };

  const fitToWidth = () => loadPage(page);

  const deleteMeasurement = async (id: string) => {
    const res = await fetch(`/api/measurements/${id}`, { method: "DELETE" });
    if (res.ok) setMeasurements((prev) => prev.filter((m) => m.id !== id));
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") resetDraft();
      if (e.key === "Enter") finishShape();
      if (e.key === "Backspace" && draftPoints.length > 0 && (tool === "linear" || tool === "area")) {
        setDraftPoints((prev) => prev.slice(0, -1));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftPoints, tool, pixelsPerMetre]);

  const pageMeasurements = measurements.filter((m) => m.page === page);

  const draftPreviewPoints = cursorPos ? [...draftPoints, cursorPos] : draftPoints;
  const draftLength =
    pixelsPerMetre && draftPoints.length > 0 && cursorPos
      ? polylineLength([...draftPoints, cursorPos]) / pixelsPerMetre
      : null;

  return (
    <div className="flex h-screen flex-col bg-slate-100">
      <header className="flex items-center gap-4 border-b border-slate-200 bg-white px-4 py-2">
        <Link href={`/projects/${projectId}`} className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" /> {projectName}
        </Link>
        <span className="text-sm text-slate-400">/</span>
        <span className="truncate text-sm font-medium text-slate-800">{documentName}</span>
        <span className="ml-auto text-xs text-slate-400">{saving ? "Saving..." : ""}</span>
      </header>

      <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-2">
        {TOOLS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => changeTool(t.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium",
                tool === t.id ? "bg-blue-700 text-white" : "text-slate-600 hover:bg-slate-100",
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}

        <div className="mx-2 h-6 w-px bg-slate-200" />

        <div className="flex items-center gap-2">
          <Label htmlFor="measurement-label" className="mb-0 text-xs">Label</Label>
          <Input
            id="measurement-label"
            className="w-40"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={defaultLabelFor(tool === "count" ? "COUNT" : tool === "area" ? "AREA" : "LINEAR")}
          />
        </div>

        <div className="flex items-center gap-1">
          {MEASUREMENT_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={cn(
                "h-6 w-6 rounded-full border-2",
                color === c ? "border-slate-900" : "border-transparent",
              )}
              style={{ backgroundColor: c }}
              aria-label={`Colour ${c}`}
            />
          ))}
        </div>

        {(tool === "linear" || tool === "area") && draftPoints.length > 0 && (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={finishShape}>
              <Check className="h-4 w-4" /> Finish
            </Button>
            <Button size="sm" variant="ghost" onClick={resetDraft}>
              <X className="h-4 w-4" /> Cancel
            </Button>
          </div>
        )}

        <div className="ml-auto flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => zoomBy(0.8)}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => zoomBy(1.25)}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={fitToWidth}>
            <Maximize className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div ref={containerRef} className="relative flex-1 overflow-hidden bg-slate-200">
          {pdfError && (
            <p className="p-6 text-sm text-red-600">{pdfError}</p>
          )}
          {loadingPage && !pdfError && (
            <p className="p-6 text-sm text-slate-500">Loading plan...</p>
          )}
          {bgImage && (
            <Stage
              ref={stageRef}
              width={containerSize.width}
              height={containerSize.height}
              scaleX={stageScale}
              scaleY={stageScale}
              x={stagePos.x}
              y={stagePos.y}
              draggable={tool === "pan"}
              onDragEnd={(e) => setStagePos({ x: e.target.x(), y: e.target.y() })}
              onClick={onStageClick}
              onDblClick={onStageDblClick}
              onMouseMove={onMouseMove}
              onWheel={onWheel}
              className={tool === "pan" ? "cursor-grab" : "cursor-crosshair"}
            >
              <Layer>
                <KonvaImage image={bgImage} width={imageSize.width} height={imageSize.height} />
              </Layer>
              <Layer>
                {pageMeasurements.map((m) => (
                  <MeasurementShape key={m.id} measurement={m} />
                ))}
                {(tool === "linear" || tool === "area") && draftPreviewPoints.length > 0 && (
                  <Line
                    points={flattenPoints(draftPreviewPoints)}
                    stroke={color}
                    strokeWidth={2}
                    dash={[8, 4]}
                    closed={tool === "area"}
                    fill={tool === "area" ? `${color}33` : undefined}
                    strokeScaleEnabled={false}
                  />
                )}
                {draftPoints.map((p, i) => (
                  <Circle key={i} x={p.x} y={p.y} radius={4 / stageScale} fill={color} />
                ))}
                {tool === "calibrate" &&
                  draftPoints.map((p, i) => (
                    <Circle key={i} x={p.x} y={p.y} radius={5 / stageScale} fill="#dc2626" />
                  ))}
              </Layer>
            </Stage>
          )}

          {draftLength !== null && (
            <div className="pointer-events-none absolute left-4 top-4 rounded-md bg-slate-900/80 px-2 py-1 text-xs text-white">
              {formatNumber(draftLength)} m
            </div>
          )}

          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-md bg-white px-3 py-1.5 text-sm shadow">
            <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Prev
            </Button>
            <span className="text-slate-600">
              Page {page} of {numPages || "?"}
            </span>
            <Button size="sm" variant="ghost" disabled={page >= numPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>

          <div className="absolute right-4 top-4 rounded-md bg-white px-3 py-1.5 text-xs text-slate-600 shadow">
            {pixelsPerMetre
              ? `Scale set: ${formatNumber(pixelsPerMetre)} px/m`
              : "Not calibrated — use the Calibrate tool"}
          </div>
        </div>

        <aside className="w-72 shrink-0 overflow-y-auto border-l border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-800">Measurements &mdash; page {page}</h2>
          {pageMeasurements.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">
              Nothing measured on this page yet. Calibrate the scale, then use Linear, Area or Count.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {pageMeasurements.map((m) => (
                <li key={m.id} className="flex items-center justify-between rounded-md border border-slate-100 px-2 py-1.5 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: m.color }} />
                    <div>
                      <p className="font-medium text-slate-800">{m.label}</p>
                      <p className="text-xs text-slate-500">
                        {formatNumber(m.quantity)} {m.unit}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => deleteMeasurement(m.id)} className="text-slate-400 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 rounded-md bg-slate-50 p-3 text-xs text-slate-500">
            <p className="font-medium text-slate-700">How to use</p>
            <ol className="mt-1 list-decimal space-y-1 pl-4">
              <li>Pick <b>Calibrate</b>, click two points on a known dimension, enter its real length.</li>
              <li>Pick <b>Linear</b> or <b>Area</b>, click points, then Finish (or double-click).</li>
              <li>Pick <b>Count</b> and click each item to tally it.</li>
              <li>Scroll to zoom, use Pan to drag around the sheet.</li>
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}

function MeasurementShape({ measurement }: { measurement: MeasurementDTO }) {
  const { type, points, color, label } = measurement;

  if (type === "COUNT") {
    const p = points[0];
    return (
      <>
        <Circle x={p.x} y={p.y} radius={8} fill={color} opacity={0.85} />
        <KonvaText x={p.x + 10} y={p.y - 6} text={label} fontSize={12} fill={color} />
      </>
    );
  }

  return (
    <Line
      points={flattenPoints(points)}
      stroke={color}
      strokeWidth={2}
      closed={type === "AREA"}
      fill={type === "AREA" ? `${color}33` : undefined}
      strokeScaleEnabled={false}
    />
  );
}

function defaultLabelFor(type: MeasurementType) {
  if (type === "AREA") return `Area (${MEASUREMENT_UNITS.AREA})`;
  if (type === "COUNT") return "Count";
  return `Run (${MEASUREMENT_UNITS.LINEAR})`;
}
