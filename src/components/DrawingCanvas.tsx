import { useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from "react";
import { Canvas, PencilBrush, Path } from "fabric";
import type { RemoteCursor } from "../types";

export interface DrawingCanvasHandle {
  undo: () => void;
  redo: () => void;
  clearBoard: () => void;
  saveBoard: (format?: "png" | "pdf") => void;
  applyRemoteDraw: (payload: unknown) => void;
  applyRemoteClear: () => void;
}

interface Props {
  selectedColor: string;
  brushSize: number;
  tool: "pen" | "eraser";
  remoteCursors: Map<string, RemoteCursor>;
  onDraw?: (payload: unknown) => void;
  onCursorMove?: (x: number, y: number) => void;
  onBoardAction?: (type: "clear" | "undo" | "redo") => void;
}

const CURSOR_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#8b5cf6", "#ec4899", "#14b8a6",
];

function userColor(userId: string) {
  let h = 0;
  for (let i = 0; i < userId.length; i++) {
    h = userId.charCodeAt(i) + ((h << 5) - h);
  }
  return CURSOR_COLORS[Math.abs(h) % CURSOR_COLORS.length];
}

const DrawingCanvas = forwardRef<DrawingCanvasHandle, Props>(
  ({ selectedColor, brushSize, tool, remoteCursors, onDraw, onCursorMove, onBoardAction }, ref) => {
    const canvasElRef = useRef<HTMLCanvasElement>(null);
    const fabricRef = useRef<Canvas | null>(null);

    const undoStack = useRef<string[]>([]);
    const redoStack = useRef<string[]>([]);
    const fromRemote = useRef(false);

    const brushRef = useRef({ color: "#000000", width: 4 });

    const getCanvas = useCallback(() => {
      if (!fabricRef.current) return "{}";
      return JSON.stringify(fabricRef.current.toJSON());
    }, []);

    const restoregetCanvas = useCallback(async (json: string) => {
      const c = fabricRef.current;
      if (!c) return;
      await c.loadFromJSON(JSON.parse(json));
      c.backgroundColor = "#ffffff";

      c.isDrawingMode = true;
      const brush = new PencilBrush(c);
      brush.color = brushRef.current.color;
      brush.width = brushRef.current.width;
      c.freeDrawingBrush = brush;
      c.renderAll();
    }, []);

    useEffect(() => {
      if (!canvasElRef.current) return;

      const w = Math.min(window.innerWidth - 100, 1500);
      const h = Math.min(window.innerHeight - 220, 750);

      const canvas = new Canvas(canvasElRef.current, {
        width: w,
        height: h,
        backgroundColor: "#ffffff",
        isDrawingMode: true,
      });

      const brush = new PencilBrush(canvas);
      brush.color = selectedColor;
      brush.width = brushSize;
      canvas.freeDrawingBrush = brush;

      undoStack.current = [JSON.stringify(canvas.toJSON())];
      redoStack.current = [];

      canvas.on("path:created", e => {
        if (fromRemote.current) return;
        const path = e.path as Path;
        onDraw?.(path.toObject());

        undoStack.current.push(getCanvas());
        if (undoStack.current.length > 51) undoStack.current.shift();
        redoStack.current = [];
      });

      canvas.on("mouse:move", opt => {
        const p = canvas.getViewportPoint(opt.e);
        onCursorMove?.(Math.round(p.x), Math.round(p.y));
      });

      fabricRef.current = canvas;

      function onResize() {
        const nw = Math.min(window.innerWidth - 100, 1500);
        const nh = Math.min(window.innerHeight - 220, 750);
        canvas.setWidth(nw);
        canvas.setHeight(nh);
        canvas.renderAll();
      }

      window.addEventListener("resize", onResize);
      return () => {
        window.removeEventListener("resize", onResize);
        canvas.dispose();
      };
    }, []);

    useEffect(() => {
      const canvas = fabricRef.current;
      if (!canvas?.freeDrawingBrush) return;

      if (tool === "eraser") {
        canvas.freeDrawingBrush.color = "#ffffff";
        canvas.freeDrawingBrush.width = brushSize * 4;
        brushRef.current = { color: "#ffffff", width: brushSize * 4 };
      } else {
        canvas.freeDrawingBrush.color = selectedColor;
        canvas.freeDrawingBrush.width = brushSize;
        brushRef.current = { color: selectedColor, width: brushSize };
      }
    }, [selectedColor, brushSize, tool]);

    useImperativeHandle(ref, () => ({
      undo() {
        if (undoStack.current.length <= 1) return;
        const cur = undoStack.current.pop()!;
        redoStack.current.push(cur);
        restoregetCanvas(undoStack.current[undoStack.current.length - 1]);
        onBoardAction?.("undo");
      },

      redo() {
        const next = redoStack.current.pop();
        if (!next) return;
        undoStack.current.push(next);
        restoregetCanvas(next);
        onBoardAction?.("redo");
      },

      clearBoard() {
        const canvas = fabricRef.current;
        if (!canvas) return;
        undoStack.current.push(getCanvas());
        if (undoStack.current.length > 51) undoStack.current.shift();
        redoStack.current = [];
        canvas.clear();
        canvas.backgroundColor = "#ffffff";
        canvas.isDrawingMode = true;
        const brush = new PencilBrush(canvas);
        brush.color = brushRef.current.color;
        brush.width = brushRef.current.width;
        canvas.freeDrawingBrush = brush;
        canvas.renderAll();
        onBoardAction?.("clear");
      },

      async saveBoard(format = "png") {
        const canvas = fabricRef.current;
        if (!canvas) return;
        canvas.backgroundColor = "#ffffff";
        canvas.renderAll();

        if (format === "pdf") {
          const { jsPDF } = await import("jspdf");
          const dataUrl = canvas.toDataURL({ format: "jpeg", quality: 0.95, multiplier: 1 });
          const pdf = new jsPDF({
            orientation: canvas.getWidth() > canvas.getHeight() ? "landscape" : "portrait",
            unit: "px",
            format: [canvas.getWidth(), canvas.getHeight()],
          });
          pdf.addImage(dataUrl, "JPEG", 0, 0, canvas.getWidth(), canvas.getHeight());
          pdf.save("syncboard.pdf");
        } else {
          const a = document.createElement("a");
          a.download = "syncboard.png";
          a.href = canvas.toDataURL({ format: "png", multiplier: 2 });
          a.click();
        }
      },

      applyRemoteDraw(payload: unknown) {
        const canvas = fabricRef.current;
        if (!canvas) return;
        fromRemote.current = true;
        const p = new Path((payload as { path: string }).path, payload as object);
        canvas.add(p);
        canvas.renderAll();
        fromRemote.current = false;
      },

      applyRemoteClear() {
        const canvas = fabricRef.current;
        if (!canvas) return;
        fromRemote.current = true;
        canvas.clear();
        canvas.backgroundColor = "#ffffff";
        canvas.renderAll();
        fromRemote.current = false;
      },
    }));

    return (
      <div className="canvas-wrapper" style={{ position: "relative" }}>
        <canvas ref={canvasElRef} />
        {Array.from(remoteCursors.values()).map(cursor => {
          const col = userColor(cursor.userId);
          return (
            <div
              key={cursor.userId}
              className="remote-cursor"
              style={{ left: cursor.x, top: cursor.y, "--cursor-color": col } as React.CSSProperties}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill={col}>
                <path d="M0 0 L0 14 L4 10 L7 14 L9 13 L6 9 L11 9 Z" />
              </svg>
              <span className="cursor-label" style={{ background: col }}>{cursor.name}</span>
            </div>
          );
        })}
      </div>
    );
  }
);

DrawingCanvas.displayName = "DrawingCanvas";
export default DrawingCanvas;
