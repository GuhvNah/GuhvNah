import { useEffect, useRef, useState } from "react";

// Fixed internal render scale. Every page is rasterised at this scale so
// stored point coordinates stay consistent across sessions; zooming in the
// UI is done by scaling the Konva stage, not by re-rendering at a new scale.
export const RENDER_SCALE = 2;

type PdfDocumentProxy = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfPageProxy>;
};

type PdfPageProxy = {
  getViewport: (opts: { scale: number }) => { width: number; height: number };
  render: (opts: { canvasContext: CanvasRenderingContext2D; viewport: unknown }) => {
    promise: Promise<void>;
  };
};

export function usePdfDocument(fileUrl: string | null) {
  const [numPages, setNumPages] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const docRef = useRef<PdfDocumentProxy | null>(null);

  useEffect(() => {
    if (!fileUrl) return;
    let cancelled = false;

    async function load() {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const res = await fetch(fileUrl!, { credentials: "same-origin" });
        if (!res.ok) throw new Error("Failed to load plan");
        const bytes = await res.arrayBuffer();

        const doc = (await pdfjsLib.getDocument({ data: bytes }).promise) as unknown as PdfDocumentProxy;
        if (cancelled) return;
        docRef.current = doc;
        setNumPages(doc.numPages);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load plan");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [fileUrl]);

  async function renderPage(pageNumber: number) {
    const doc = docRef.current;
    if (!doc) return null;
    const page = await doc.getPage(pageNumber);
    const viewport = page.getViewport({ scale: RENDER_SCALE });

    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    await page.render({ canvasContext: ctx, viewport }).promise;

    const image = new Image();
    const dataUrl = canvas.toDataURL("image/png");
    await new Promise<void>((resolve) => {
      image.onload = () => resolve();
      image.src = dataUrl;
    });

    return { image, width: canvas.width, height: canvas.height };
  }

  return { numPages, error, renderPage };
}
