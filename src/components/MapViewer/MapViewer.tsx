import { RotateCcw, Trash2, Upload, Wifi } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import PeerJSConnector from "./PeerJSConnector";
import { BroadcastChannelTransport } from "./transport";
import type {
  Camera,
  MapMessage,
  MapState,
  MapTransport,
  RevealedZone,
  Token,
} from "./types";

const STORAGE_KEY = "dnd-ct:map-state:v1";
const FOG_DM_OPACITY = 0.4;
const FOG_PLAYER_OPACITY = 1;

const DEFAULT_MAP_STATE: MapState = {
  imageDataUrl: null,
  token: { x: 400, y: 300, radius: 20, color: "#4ade80" },
  revealedZones: [],
};

function loadFromStorage(): MapState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    // imageDataUrl is never persisted — too large for localStorage
    const state = JSON.parse(raw) as Omit<MapState, "imageDataUrl">;
    return { ...state, imageDataUrl: null };
  } catch {
    return null;
  }
}

function screenToWorld(
  sx: number,
  sy: number,
  camera: Camera,
): { x: number; y: number } {
  return {
    x: (sx - camera.x) / camera.scale,
    y: (sy - camera.y) / camera.scale,
  };
}

interface Props {
  transport?: MapTransport;
}

export const PLAYER_WINDOW_NAME = "dnd-map-player-view";

export default function MapViewer({ transport: transportProp }: Props) {
  // window.name is set by window.open(url, name) and persists in the opened tab
  const [view, setView] = useState<"dm" | "player">(
    window.name === PLAYER_WINDOW_NAME ? "player" : "dm",
  );
  // PeerJS modal + override transport (replaces BroadcastChannel when connected)
  const [peerModalOpen, setPeerModalOpen] = useState(false);
  const [peerTransport, setPeerTransport] = useState<MapTransport | null>(null);
  const [peerDisconnected, setPeerDisconnected] = useState(false);

  const [mapState, setMapState] = useState<MapState>(
    // Player view always starts empty — waits for DM sync
    () =>
      view === "player"
        ? DEFAULT_MAP_STATE
        : (loadFromStorage() ?? DEFAULT_MAP_STATE),
  );
  const [synced, setSynced] = useState(view === "dm"); // player waits for first FULL_STATE_RESPONSE
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, scale: 1 });
  // Undo/redo history — DM only, not persisted or synced
  const [undoStack, setUndoStack] = useState<RevealedZone[][]>([]);
  const [redoStack, setRedoStack] = useState<RevealedZone[][]>([]);
  const [revealRadius, setRevealRadius] = useState(80);
  const revealRadiusRef = useRef(revealRadius);
  revealRadiusRef.current = revealRadius;

  // Refs for RAF loop (avoids stale closures)
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fogCanvasRef = useRef<OffscreenCanvas | null>(null);
  const mapImageRef = useRef<HTMLImageElement | null>(null);
  const mapStateRef = useRef(mapState);
  mapStateRef.current = mapState;
  const cameraRef = useRef(camera);
  cameraRef.current = camera;

  // Interaction refs (avoid re-renders on every mouse move)
  const isDraggingTokenRef = useRef(false);
  const draggingTokenPosRef = useRef<{ x: number; y: number } | null>(null);
  const isPanningRef = useRef(false);
  const lastPanPosRef = useRef({ x: 0, y: 0 });
  // Touch / pinch refs
  const lastPinchDistRef = useRef<number | null>(null);
  const lastPinchCenterRef = useRef<{ x: number; y: number } | null>(null);

  // Transport ref — populated inside the sync effect so it's always a live channel
  const transportRef = useRef<MapTransport | null>(null);

  // Warn before leaving when a map is loaded — the image is not persisted
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (mapStateRef.current.imageDataUrl) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  // Load map image when imageDataUrl changes
  useEffect(() => {
    if (!mapState.imageDataUrl) {
      mapImageRef.current = null;
      return;
    }
    const img = new Image();
    img.src = mapState.imageDataUrl;
    img.onload = () => {
      mapImageRef.current = img;
    };
  }, [mapState.imageDataUrl]);

  // Persist token position and fog zones — image is intentionally excluded
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { imageDataUrl: _img, ...rest } = mapState;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
  }, [mapState]);

  // Sync effect — re-runs when transport changes (BroadcastChannel → PeerJS swap)
  // BroadcastChannelTransport is created here so Strict Mode's double-invoke gets a
  // fresh channel each time. PeerJSTransport is provided externally and must NOT be
  // closed in the cleanup — Strict Mode would kill the live connection prematurely.
  useEffect(() => {
    const isLocalTransport = !peerTransport && !transportProp;
    const transport =
      peerTransport ?? transportProp ?? new BroadcastChannelTransport();
    transportRef.current = transport;

    // Register listener BEFORE sending, to avoid missing a fast response
    const unsub = transport.onMessage((msg: MapMessage) => {
      switch (msg.type) {
        case "REQUEST_FULL_STATE":
          if (view === "dm") {
            transport.send({
              type: "FULL_STATE_RESPONSE",
              state: mapStateRef.current,
            });
          }
          break;
        case "FULL_STATE_RESPONSE":
          if (view === "player") {
            setMapState(msg.state);
            setSynced(true);
          }
          break;
        case "TOKEN_MOVED":
          setMapState((s) => ({ ...s, token: msg.token }));
          break;
        case "FOG_UPDATED":
          setMapState((s) => ({ ...s, revealedZones: msg.revealedZones }));
          break;
        case "MAP_LOADED":
          setMapState((s) => ({ ...s, imageDataUrl: msg.imageDataUrl }));
          break;
      }
    });

    if (view === "player") {
      transport.send({ type: "REQUEST_FULL_STATE" });
    }

    const unsubClose = transport.onClose(() => {
      setPeerTransport(null);
      setPeerDisconnected(true);
    });

    return () => {
      unsub();
      unsubClose();
      if (isLocalTransport) {
        transport.close();
      }
    };
  }, [view, transportProp, peerTransport]);

  // Resize canvas to fill container
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const sync = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    const observer = new ResizeObserver(sync);
    observer.observe(canvas);
    sync();
    return () => observer.disconnect();
  }, []);

  // RAF rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let rafId: number;

    function render() {
      const w = canvas!.width;
      const h = canvas!.height;
      if (w === 0 || h === 0) {
        rafId = requestAnimationFrame(render);
        return;
      }

      const { x: panX, y: panY, scale } = cameraRef.current;
      const { token, revealedZones } = mapStateRef.current;

      // Use live drag position if currently dragging
      const tokenPos =
        isDraggingTokenRef.current && draggingTokenPosRef.current
          ? draggingTokenPosRef.current
          : token;

      // 1. Clear
      ctx.clearRect(0, 0, w, h);

      // 2. Apply camera + draw map
      ctx.setTransform(scale, 0, 0, scale, panX, panY);
      const img = mapImageRef.current;
      if (img) {
        ctx.drawImage(img, 0, 0);
      } else {
        // Placeholder grid when no map is loaded
        ctx.fillStyle = "#1a1a2e";
        ctx.fillRect(0, 0, 2000, 2000);
        ctx.strokeStyle = "#2a2a4e";
        ctx.lineWidth = 1 / scale;
        for (let x = 0; x <= 2000; x += 50) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, 2000);
          ctx.stroke();
        }
        for (let y = 0; y <= 2000; y += 50) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(2000, y);
          ctx.stroke();
        }
      }

      // 3. Fog layer — draw on offscreen canvas then composite onto main
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      if (
        !fogCanvasRef.current ||
        fogCanvasRef.current.width !== w ||
        fogCanvasRef.current.height !== h
      ) {
        fogCanvasRef.current = new OffscreenCanvas(w, h);
      }
      const fogCtx = fogCanvasRef.current.getContext("2d")!;
      fogCtx.clearRect(0, 0, w, h);
      fogCtx.fillStyle = "#000";
      fogCtx.fillRect(0, 0, w, h);

      const dragPos = isDraggingTokenRef.current
        ? draggingTokenPosRef.current
        : null;

      if (revealedZones.length > 0 || dragPos) {
        fogCtx.save();
        fogCtx.setTransform(scale, 0, 0, scale, panX, panY);
        fogCtx.globalCompositeOperation = "destination-out";

        const drawFogZone = (x: number, y: number, radius: number) => {
          const grad = fogCtx.createRadialGradient(x, y, 0, x, y, radius);
          grad.addColorStop(0, "rgba(0,0,0,1)");
          grad.addColorStop(0.7, "rgba(0,0,0,0.8)");
          grad.addColorStop(1, "rgba(0,0,0,0)");
          fogCtx.fillStyle = grad;
          fogCtx.beginPath();
          fogCtx.arc(x, y, radius, 0, Math.PI * 2);
          fogCtx.fill();
        };

        for (const zone of revealedZones) {
          drawFogZone(zone.x, zone.y, zone.radius);
        }
        if (dragPos) {
          drawFogZone(dragPos.x, dragPos.y, revealRadiusRef.current);
        }

        fogCtx.restore();
      }

      ctx.globalAlpha = view === "dm" ? FOG_DM_OPACITY : FOG_PLAYER_OPACITY;
      ctx.drawImage(fogCanvasRef.current, 0, 0);
      ctx.globalAlpha = 1;

      // 4. Token
      ctx.setTransform(scale, 0, 0, scale, panX, panY);
      ctx.beginPath();
      ctx.arc(tokenPos.x, tokenPos.y, token.radius, 0, Math.PI * 2);
      ctx.fillStyle = token.color;
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2 / scale;
      ctx.stroke();

      // 5. Reset transform
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      rafId = requestAnimationFrame(render);
    }

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [view]);

  // --- Interaction helpers (shared by mouse and touch handlers) ---

  const startPointerInteraction = useCallback(
    (sx: number, sy: number, clientX: number, clientY: number) => {
      const world = screenToWorld(sx, sy, cameraRef.current);
      const { token } = mapStateRef.current;
      if (
        view === "dm" &&
        Math.hypot(world.x - token.x, world.y - token.y) <= token.radius * 1.5
      ) {
        isDraggingTokenRef.current = true;
        draggingTokenPosRef.current = { x: token.x, y: token.y };
      } else {
        isPanningRef.current = true;
        lastPanPosRef.current = { x: clientX, y: clientY };
      }
    },
    [view],
  );

  const updatePointerInteraction = useCallback(
    (sx: number, sy: number, clientX: number, clientY: number) => {
      if (isDraggingTokenRef.current) {
        draggingTokenPosRef.current = screenToWorld(sx, sy, cameraRef.current);
      } else if (isPanningRef.current) {
        const dx = clientX - lastPanPosRef.current.x;
        const dy = clientY - lastPanPosRef.current.y;
        lastPanPosRef.current = { x: clientX, y: clientY };
        setCamera((c) => ({ ...c, x: c.x + dx, y: c.y + dy }));
      }
    },
    [],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (e.button !== 0) return;
      const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
      startPointerInteraction(
        e.clientX - rect.left,
        e.clientY - rect.top,
        e.clientX,
        e.clientY,
      );
    },
    [startPointerInteraction],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
      updatePointerInteraction(
        e.clientX - rect.left,
        e.clientY - rect.top,
        e.clientX,
        e.clientY,
      );
    },
    [updatePointerInteraction],
  );

  const handleMouseUp = useCallback(() => {
    if (isDraggingTokenRef.current) {
      isDraggingTokenRef.current = false;
      const finalPos = draggingTokenPosRef.current;
      draggingTokenPosRef.current = null;

      if (finalPos) {
        const token: Token = { ...mapStateRef.current.token, ...finalPos };
        const prevZones = mapStateRef.current.revealedZones;
        const revealedZones: RevealedZone[] = [
          ...prevZones,
          { x: finalPos.x, y: finalPos.y, radius: revealRadius },
        ];
        // Update ref immediately so next render frame is correct
        mapStateRef.current = { ...mapStateRef.current, token, revealedZones };
        setMapState(mapStateRef.current);
        setUndoStack((s) => [...s.slice(-49), prevZones]);
        setRedoStack([]);

        transportRef.current?.send({ type: "TOKEN_MOVED", token });
        transportRef.current?.send({ type: "FOG_UPDATED", revealedZones });
      }
    }
    isPanningRef.current = false;
  }, [revealRadius]);

  const applyFogHistory = useCallback(
    (
      fromStack: RevealedZone[][],
      setFromStack: React.Dispatch<React.SetStateAction<RevealedZone[][]>>,
      setToStack: React.Dispatch<React.SetStateAction<RevealedZone[][]>>,
    ) => {
      if (fromStack.length === 0) return;
      const revealedZones = fromStack[fromStack.length - 1];
      setFromStack((s) => s.slice(0, -1));
      setToStack((s) => [...s, mapStateRef.current.revealedZones]);
      const newState = { ...mapStateRef.current, revealedZones };
      mapStateRef.current = newState;
      setMapState(newState);
      transportRef.current?.send({ type: "FOG_UPDATED", revealedZones });
    },
    [],
  );

  const applyZoom = useCallback((deltaY: number, sx: number, sy: number) => {
    const zoomFactor = Math.pow(0.999, deltaY);
    const world = screenToWorld(sx, sy, cameraRef.current);
    setCamera((c) => {
      const newScale = Math.min(5, Math.max(0.1, c.scale * zoomFactor));
      return {
        scale: newScale,
        x: sx - world.x * newScale,
        y: sy - world.y * newScale,
      };
    });
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;

      if (e.ctrlKey) {
        // Trackpad pinch-to-zoom (browser sets ctrlKey for pinch gestures)
        applyZoom(e.deltaY, sx, sy);
      } else if (e.deltaMode === 0) {
        // Trackpad two-finger scroll (smooth, pixel-level deltas) → pan
        setCamera((c) => ({ ...c, x: c.x - e.deltaX, y: c.y - e.deltaY }));
      } else {
        // Mouse scroll wheel (discrete steps, deltaMode === 1) → zoom
        applyZoom(e.deltaY, sx, sy);
      }
    },
    [applyZoom],
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
        startPointerInteraction(
          touch.clientX - rect.left,
          touch.clientY - rect.top,
          touch.clientX,
          touch.clientY,
        );
        lastPinchDistRef.current = null;
      } else if (e.touches.length === 2) {
        isDraggingTokenRef.current = false;
        isPanningRef.current = false;
        const t0 = e.touches[0];
        const t1 = e.touches[1];
        lastPinchDistRef.current = Math.hypot(
          t1.clientX - t0.clientX,
          t1.clientY - t0.clientY,
        );
        lastPinchCenterRef.current = {
          x: (t0.clientX + t1.clientX) / 2,
          y: (t0.clientY + t1.clientY) / 2,
        };
      }
    },
    [startPointerInteraction],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
        updatePointerInteraction(
          touch.clientX - rect.left,
          touch.clientY - rect.top,
          touch.clientX,
          touch.clientY,
        );
      } else if (
        e.touches.length === 2 &&
        lastPinchDistRef.current !== null &&
        lastPinchCenterRef.current !== null
      ) {
        const t0 = e.touches[0];
        const t1 = e.touches[1];
        const newDist = Math.hypot(
          t1.clientX - t0.clientX,
          t1.clientY - t0.clientY,
        );
        const newCenter = {
          x: (t0.clientX + t1.clientX) / 2,
          y: (t0.clientY + t1.clientY) / 2,
        };
        const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
        const sx = newCenter.x - rect.left;
        const sy = newCenter.y - rect.top;
        const zoomFactor = newDist / lastPinchDistRef.current;
        const panDx = newCenter.x - lastPinchCenterRef.current.x;
        const panDy = newCenter.y - lastPinchCenterRef.current.y;
        const world = screenToWorld(sx, sy, cameraRef.current);
        setCamera((c) => {
          const newScale = Math.min(5, Math.max(0.1, c.scale * zoomFactor));
          return {
            scale: newScale,
            x: sx - world.x * newScale + panDx,
            y: sy - world.y * newScale + panDy,
          };
        });
        lastPinchDistRef.current = newDist;
        lastPinchCenterRef.current = newCenter;
      }
    },
    [updatePointerInteraction],
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      if (e.touches.length === 0) {
        // Last finger lifted — commit any token drag
        handleMouseUp();
        lastPinchDistRef.current = null;
        lastPinchCenterRef.current = null;
      } else if (e.touches.length === 1) {
        // Went from 2 fingers to 1 — end pinch, start panning
        lastPinchDistRef.current = null;
        lastPinchCenterRef.current = null;
        isPanningRef.current = true;
        lastPanPosRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      }
    },
    [handleMouseUp],
  );

  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const imageDataUrl = ev.target?.result as string;
      const newState: MapState = {
        ...mapStateRef.current,
        imageDataUrl,
        revealedZones: [],
      };
      mapStateRef.current = newState;
      setMapState(newState);
      transportRef.current?.send({ type: "MAP_LOADED", imageDataUrl });
    };
    reader.readAsDataURL(file);
    // Reset input so the same file can be re-imported
    e.target.value = "";
  }, []);

  const openPlayerView = useCallback(() => {
    // Open the same URL with a named window — the name is how MapViewer detects player mode
    window.open(window.location.href, PLAYER_WINDOW_NAME);
  }, []);

  const cursorStyle =
    view === "player"
      ? "grab"
      : isDraggingTokenRef.current
        ? "grabbing"
        : "crosshair";

  return (
    <div className="w-full h-screen bg-black flex flex-col relative overflow-hidden">
      {/* Toolbar */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1 flex-wrap">
        {/* Section 1 — navigation & status */}
        <div className="flex items-center gap-1 bg-panel-bg/90 border border-border-primary rounded-lg px-2 py-1">
          <button
            onClick={() => {
              location.hash = "";
            }}
            className="hover:text-text-primary text-text-muted px-2 py-0.5 rounded text-sm transition"
          >
            ← Back
          </button>
          <span className="w-px h-4 bg-border-primary mx-1" />
          <span
            className={`px-2 py-0.5 rounded text-xs font-bold tracking-wide ${
              view === "dm" ? "bg-red-600 text-white" : "bg-blue-600 text-white"
            }`}
          >
            {view === "dm" ? "DM View" : "Player View"}
          </span>
          <span className="text-text-muted text-xs tabular-nums ml-1">
            {Math.round(camera.scale * 100)}%
          </span>
        </div>

        {view === "dm" && (
          <>
            {/* Section 2 — fog controls */}
            <div className="flex items-center gap-1 bg-panel-bg/90 border border-border-primary rounded-lg px-2 py-1">
              <label className="hover:bg-panel-secondary text-text-primary px-2 py-1 rounded text-sm cursor-pointer transition flex items-center gap-1.5">
                <Upload className="w-4 h-4" />
                Import Map
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImport}
                />
              </label>
              <span className="w-px h-4 bg-border-primary mx-0.5" />
              <label className="text-text-primary px-2 py-1 rounded text-sm flex items-center gap-2">
                <span className="whitespace-nowrap text-text-muted text-xs">
                  Visibility
                </span>
                <input
                  type="range"
                  min={20}
                  max={300}
                  value={revealRadius}
                  onChange={(e) => setRevealRadius(Number(e.target.value))}
                  className="w-20 accent-blue-400"
                />
                <span className="tabular-nums w-8 text-right text-text-muted text-xs">
                  {revealRadius}
                </span>
              </label>
              <span className="w-px h-4 bg-border-primary mx-0.5" />
              <button
                onClick={() =>
                  applyFogHistory(undoStack, setUndoStack, setRedoStack)
                }
                disabled={undoStack.length === 0}
                className="hover:bg-panel-secondary disabled:opacity-40 disabled:cursor-not-allowed text-text-primary px-2 py-1 rounded text-sm transition flex items-center gap-1.5"
                title="Undo last reveal"
              >
                <RotateCcw className="w-4 h-4" />
                Undo
              </button>
              <button
                onClick={() =>
                  applyFogHistory(redoStack, setRedoStack, setUndoStack)
                }
                disabled={redoStack.length === 0}
                className="hover:bg-panel-secondary disabled:opacity-40 disabled:cursor-not-allowed text-text-primary px-2 py-1 rounded text-sm transition flex items-center gap-1.5"
                title="Redo last reveal"
              >
                <RotateCcw className="w-4 h-4 scale-x-[-1]" />
                Redo
              </button>
              <button
                onClick={() => {
                  const prevZones = mapStateRef.current.revealedZones;
                  if (prevZones.length === 0) return;
                  setUndoStack((s) => [...s, prevZones]);
                  setRedoStack([]);
                  const revealedZones: RevealedZone[] = [];
                  const newState = { ...mapStateRef.current, revealedZones };
                  mapStateRef.current = newState;
                  setMapState(newState);
                  transportRef.current?.send({
                    type: "FOG_UPDATED",
                    revealedZones,
                  });
                }}
                disabled={mapState.revealedZones.length === 0}
                className="hover:bg-panel-secondary disabled:opacity-40 disabled:cursor-not-allowed text-text-primary px-2 py-1 rounded text-sm transition flex items-center gap-1.5"
                title="Reset all fog"
              >
                <Trash2 className="w-4 h-4" />
                Reset Fog
              </button>
            </div>

            {/* Section 3 — sync */}
            <div className="flex items-center gap-1 bg-panel-bg/90 border border-border-primary rounded-lg px-2 py-1">
              <span className="text-xs text-text-muted px-1 select-none">
                Local
              </span>
              <button
                onClick={openPlayerView}
                className="hover:bg-panel-secondary text-text-primary px-2 py-1 rounded text-sm transition"
              >
                Open Player View
              </button>
              <span className="w-px h-4 bg-border-primary mx-1" />
              <span className="text-xs text-text-muted px-1 select-none">
                Online
              </span>
              <button
                onClick={() => setPeerModalOpen(true)}
                className="hover:bg-panel-secondary text-text-primary px-2 py-1 rounded text-sm transition flex items-center gap-1.5"
                title="Connect online via PeerJS"
              >
                <Wifi className="w-4 h-4" />
                Connect Online
              </button>
            </div>
          </>
        )}
      </div>

      {peerModalOpen && (
        <PeerJSConnector
          onConnected={(transport, role) => {
            setPeerTransport(transport);
            if (role === "player") {
              window.name = PLAYER_WINDOW_NAME;
              setView("player");
              setSynced(false);
            }
            setPeerModalOpen(false);
          }}
          onClose={() => setPeerModalOpen(false)}
        />
      )}

      {/* Disconnected banner — shown when PeerJS connection drops (e.g. device sleep) */}
      {peerDisconnected && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-panel-bg border border-border-primary rounded-lg px-4 py-3 shadow-lg">
          <span className="text-sm text-text-primary">Connection lost</span>
          <button
            onClick={() => {
              setPeerDisconnected(false);
              setPeerModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition font-semibold"
          >
            Reconnect
          </button>
          <button
            onClick={() => setPeerDisconnected(false)}
            className="text-text-muted hover:text-text-primary transition text-sm"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Waiting for DM overlay (player view, not yet synced) */}
      {view === "player" && !synced && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/90 z-20">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/70 text-sm">Waiting for DM…</p>
          <p className="text-white/30 text-xs">Make sure the DM tab is open</p>
        </div>
      )}

      {/* Helper text when no map is loaded */}
      {!mapState.imageDataUrl && view === "dm" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-white/30 text-lg select-none">
            Import a map to get started
          </p>
        </div>
      )}

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ cursor: cursorStyle, touchAction: "none" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
    </div>
  );
}
