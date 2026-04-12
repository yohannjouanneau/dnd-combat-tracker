import {
  CircleUser,
  Eye,
  EyeOff,
  MapPin,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
  Wifi,
  X,
} from "lucide-react";
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

const FOG_DM_OPACITY = 0.4;
const FOG_PLAYER_OPACITY = 1;

const DEFAULT_MAP_STATE: MapState = {
  imageDataUrl: null,
  tokens: [
    {
      id: "player",
      x: 400,
      y: 300,
      radius: 20,
      color: "#4ade80",
      hidden: false,
      revealsFog: true,
    },
  ],
  revealedZones: [],
};

type HistoryEntry = { tokens: Token[]; revealedZones: RevealedZone[] };

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

function tokenLabel(token: Token): string {
  return token.label || (token.id === "player" ? "Player Token" : "Token");
}

interface Props {
  transport?: MapTransport;
}

export const PLAYER_WINDOW_NAME = "dnd-map-player-view";

export default function MapViewer({ transport: transportProp }: Props) {
  const [view, setView] = useState<"dm" | "player">(
    window.name === PLAYER_WINDOW_NAME ? "player" : "dm",
  );
  const [peerModalOpen, setPeerModalOpen] = useState(false);
  const [peerTransport, setPeerTransport] = useState<MapTransport | null>(null);
  const [peerDisconnected, setPeerDisconnected] = useState(false);

  const [mapState, setMapState] = useState<MapState>(DEFAULT_MAP_STATE);
  const [synced, setSynced] = useState(view === "dm");
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, scale: 1 });

  const [undoStack, setUndoStack] = useState<HistoryEntry[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryEntry[]>([]);
  const [revealRadius, setRevealRadius] = useState(80);
  const revealRadiusRef = useRef(revealRadius);
  revealRadiusRef.current = revealRadius;

  // Refs for RAF loop
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fogCanvasRef = useRef<OffscreenCanvas | null>(null);
  const mapImageRef = useRef<HTMLImageElement | null>(null);
  const mapStateRef = useRef(mapState);
  mapStateRef.current = mapState;
  const cameraRef = useRef(camera);
  cameraRef.current = camera;

  // Token images — keyed by imageDataUrl so multiple tokens can share an image
  const tokenImagesRef = useRef<Map<string, HTMLImageElement>>(new Map());

  // Interaction refs
  const draggingTokenIdRef = useRef<string | null>(null);
  const draggingTokenPosRef = useRef<{ x: number; y: number } | null>(null);
  const isPanningRef = useRef(false);
  const lastPanPosRef = useRef({ x: 0, y: 0 });
  const pointerDownScreenRef = useRef<{ sx: number; sy: number } | null>(null);
  const lastPinchDistRef = useRef<number | null>(null);
  const lastPinchCenterRef = useRef<{ x: number; y: number } | null>(null);

  // Token management modal
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);

  // Pointer ping tool
  const [isPointerMode, setIsPointerMode] = useState(false);
  const isPointerModeRef = useRef(isPointerMode);
  isPointerModeRef.current = isPointerMode;
  const pingsRef = useRef<
    { id: number; x: number; y: number; startedAt: number }[]
  >([]);
  const nextPingIdRef = useRef(0);

  // Transport ref
  const transportRef = useRef<MapTransport | null>(null);

  // Warn before leaving when a map is loaded
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (mapStateRef.current.imageDataUrl) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  // Load map image
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

  // Load/update token images (keyed by dataUrl)
  useEffect(() => {
    const usedUrls = new Set<string>();
    for (const token of mapState.tokens) {
      if (!token.imageDataUrl) continue;
      usedUrls.add(token.imageDataUrl);
      if (!tokenImagesRef.current.has(token.imageDataUrl)) {
        const img = new Image();
        const url = token.imageDataUrl;
        img.src = url;
        img.onload = () => {
          tokenImagesRef.current.set(url, img);
        };
      }
    }
    // Prune unused
    for (const url of tokenImagesRef.current.keys()) {
      if (!usedUrls.has(url)) tokenImagesRef.current.delete(url);
    }
  }, [mapState.tokens]);

  // Sync effect
  useEffect(() => {
    const isLocalTransport = !peerTransport && !transportProp;
    const transport =
      peerTransport ?? transportProp ?? new BroadcastChannelTransport();
    transportRef.current = transport;

    const unsub = transport.onMessage((msg: MapMessage) => {
      if (view === "player") setSynced(true);
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
        case "TOKENS_UPDATED":
          setMapState((s) => ({ ...s, tokens: msg.tokens }));
          break;
        case "FOG_UPDATED":
          setMapState((s) => ({ ...s, revealedZones: msg.revealedZones }));
          break;
        case "MAP_LOADED":
          setMapState((s) => ({ ...s, imageDataUrl: msg.imageDataUrl }));
          break;
        case "POINTER_PING":
          pingsRef.current.push({
            id: nextPingIdRef.current++,
            x: msg.x,
            y: msg.y,
            startedAt: performance.now(),
          });
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

  // Resize canvas
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
      const { tokens, revealedZones } = mapStateRef.current;

      // 1. Clear
      ctx.clearRect(0, 0, w, h);

      // 2. Map
      ctx.setTransform(scale, 0, 0, scale, panX, panY);
      const mapImg = mapImageRef.current;
      if (mapImg) {
        ctx.drawImage(mapImg, 0, 0);
      } else {
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

      // 3. Fog layer
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

      const draggingId = draggingTokenIdRef.current;
      const dragPos = draggingId ? draggingTokenPosRef.current : null;
      const draggingToken = draggingId
        ? tokens.find((t) => t.id === draggingId)
        : null;
      const showDragFog = dragPos && draggingToken?.revealsFog;

      if (revealedZones.length > 0 || showDragFog) {
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
        if (showDragFog) {
          drawFogZone(dragPos.x, dragPos.y, revealRadiusRef.current);
        }
        fogCtx.restore();
      }

      ctx.globalAlpha = view === "dm" ? FOG_DM_OPACITY : FOG_PLAYER_OPACITY;
      ctx.drawImage(fogCanvasRef.current, 0, 0);
      ctx.globalAlpha = 1;

      // 4. Tokens
      ctx.setTransform(scale, 0, 0, scale, panX, panY);
      ctx.textAlign = "center";
      const visibleTokens =
        view === "dm" ? tokens : tokens.filter((t) => !t.hidden);

      for (const token of visibleTokens) {
        const pos =
          draggingTokenIdRef.current === token.id && draggingTokenPosRef.current
            ? draggingTokenPosRef.current
            : token;
        const { x: tx, y: ty } = pos;
        const tr = token.radius;

        if (token.hidden) ctx.globalAlpha = 0.5;

        const tokenImg = token.imageDataUrl
          ? tokenImagesRef.current.get(token.imageDataUrl)
          : undefined;

        if (tokenImg) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(tx, ty, tr, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(tokenImg, tx - tr, ty - tr, tr * 2, tr * 2);
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.arc(tx, ty, tr, 0, Math.PI * 2);
          ctx.fillStyle = token.color;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(tx, ty, tr, 0, Math.PI * 2);
        if (token.hidden) {
          ctx.setLineDash([4 / scale, 4 / scale]);
          ctx.strokeStyle = "#fbbf24";
        } else {
          ctx.setLineDash([]);
          ctx.strokeStyle = "#fff";
        }
        ctx.lineWidth = 2 / scale;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;

        if (token.label) {
          ctx.font = `bold ${12 / scale}px sans-serif`;
          ctx.fillStyle = token.hidden ? "#fbbf24" : "#fff";
          ctx.shadowColor = "#000";
          ctx.shadowBlur = 3 / scale;
          ctx.fillText(token.label, tx, ty + tr + 14 / scale);
          ctx.shadowBlur = 0;
        }
      }

      // 5. Pointer pings
      const now = performance.now();
      const PING_DURATION = 1200;
      pingsRef.current = pingsRef.current.filter(
        (p) => now - p.startedAt < PING_DURATION,
      );
      if (pingsRef.current.length > 0) {
        ctx.setTransform(scale, 0, 0, scale, panX, panY);
        for (const ping of pingsRef.current) {
          const t = (now - ping.startedAt) / PING_DURATION;
          const maxRadius = 60;
          for (let ring = 0; ring < 2; ring++) {
            const rt = Math.min(1, t * 1.5 + ring * 0.15);
            const radius = rt * maxRadius;
            const alpha = (1 - rt) * 0.85;
            ctx.beginPath();
            ctx.arc(ping.x, ping.y, radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(250,204,21,${alpha})`;
            ctx.lineWidth = (2.5 - ring * 0.5) / scale;
            ctx.stroke();
          }
          const dotAlpha = Math.max(0, 1 - t * 3);
          if (dotAlpha > 0) {
            ctx.beginPath();
            ctx.arc(ping.x, ping.y, 5 / scale, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(250,204,21,${dotAlpha})`;
            ctx.fill();
          }
        }
      }

      // 6. Reset transform
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      rafId = requestAnimationFrame(render);
    }

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [view]);

  // --- Interaction helpers ---

  const emitPing = useCallback((sx: number, sy: number) => {
    const { x, y } = screenToWorld(sx, sy, cameraRef.current);
    pingsRef.current.push({
      id: nextPingIdRef.current++,
      x,
      y,
      startedAt: performance.now(),
    });
    transportRef.current?.send({ type: "POINTER_PING", x, y });
  }, []);

  const startPointerInteraction = useCallback(
    (sx: number, sy: number, clientX: number, clientY: number) => {
      if (isPointerModeRef.current) {
        pointerDownScreenRef.current = { sx, sy };
        isPanningRef.current = true;
        lastPanPosRef.current = { x: clientX, y: clientY };
        return;
      }
      if (view === "dm") {
        const world = screenToWorld(sx, sy, cameraRef.current);
        const { tokens } = mapStateRef.current;
        let closest: Token | null = null;
        let closestDist = Infinity;
        for (const token of tokens) {
          const d = Math.hypot(world.x - token.x, world.y - token.y);
          if (d <= token.radius * 1.5 && d < closestDist) {
            closestDist = d;
            closest = token;
          }
        }
        if (closest) {
          draggingTokenIdRef.current = closest.id;
          draggingTokenPosRef.current = { x: closest.x, y: closest.y };
          return;
        }
      }
      isPanningRef.current = true;
      lastPanPosRef.current = { x: clientX, y: clientY };
    },
    [view],
  );

  const updatePointerInteraction = useCallback(
    (sx: number, sy: number, clientX: number, clientY: number) => {
      if (draggingTokenIdRef.current) {
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

  const endInteraction = useCallback(
    (sx?: number, sy?: number) => {
      // Pointer mode tap
      if (isPointerModeRef.current && pointerDownScreenRef.current !== null) {
        const down = pointerDownScreenRef.current;
        pointerDownScreenRef.current = null;
        if (
          sx !== undefined &&
          sy !== undefined &&
          Math.hypot(sx - down.sx, sy - down.sy) < 6
        ) {
          emitPing(sx, sy);
        }
        isPanningRef.current = false;
        return;
      }
      pointerDownScreenRef.current = null;

      if (draggingTokenIdRef.current !== null) {
        const tokenId = draggingTokenIdRef.current;
        draggingTokenIdRef.current = null;
        const finalPos = draggingTokenPosRef.current;
        draggingTokenPosRef.current = null;

        if (finalPos) {
          const prevTokens = mapStateRef.current.tokens;
          const draggingToken = prevTokens.find((t) => t.id === tokenId);
          if (draggingToken) {
            const tokens = prevTokens.map((t) =>
              t.id === tokenId ? { ...t, ...finalPos } : t,
            );
            const prevZones = mapStateRef.current.revealedZones;
            const revealedZones = draggingToken.revealsFog
              ? [
                  ...prevZones,
                  { x: finalPos.x, y: finalPos.y, radius: revealRadius },
                ]
              : prevZones;

            mapStateRef.current = {
              ...mapStateRef.current,
              tokens,
              revealedZones,
            };
            setMapState(mapStateRef.current);
            setUndoStack((s) => [
              ...s.slice(-49),
              { tokens: prevTokens, revealedZones: prevZones },
            ]);
            setRedoStack([]);

            transportRef.current?.send({ type: "TOKENS_UPDATED", tokens });
            if (draggingToken.revealsFog) {
              transportRef.current?.send({
                type: "FOG_UPDATED",
                revealedZones,
              });
            }
          }
        }
      }
      isPanningRef.current = false;
    },
    [revealRadius, emitPing],
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

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
      endInteraction(e.clientX - rect.left, e.clientY - rect.top);
    },
    [endInteraction],
  );

  const updateToken = useCallback((id: string, patch: Partial<Token>) => {
    const tokens = mapStateRef.current.tokens.map((t) =>
      t.id === id ? { ...t, ...patch } : t,
    );
    mapStateRef.current = { ...mapStateRef.current, tokens };
    setMapState(mapStateRef.current);
    transportRef.current?.send({ type: "TOKENS_UPDATED", tokens });
  }, []);

  const addToken = useCallback(() => {
    const id = crypto.randomUUID();
    const newToken: Token = {
      id,
      x: 500,
      y: 300,
      radius: 20,
      color: "#ef4444",
      hidden: true,
      revealsFog: false,
    };
    const tokens = [...mapStateRef.current.tokens, newToken];
    mapStateRef.current = { ...mapStateRef.current, tokens };
    setMapState(mapStateRef.current);
    transportRef.current?.send({ type: "TOKENS_UPDATED", tokens });
    setSelectedTokenId(id);
  }, []);

  const removeToken = useCallback((id: string) => {
    const tokens = mapStateRef.current.tokens.filter((t) => t.id !== id);
    mapStateRef.current = { ...mapStateRef.current, tokens };
    setMapState(mapStateRef.current);
    transportRef.current?.send({ type: "TOKENS_UPDATED", tokens });
    setSelectedTokenId((prev) => (prev === id ? null : prev));
  }, []);

  const applyHistory = useCallback(
    (
      fromStack: HistoryEntry[],
      setFromStack: React.Dispatch<React.SetStateAction<HistoryEntry[]>>,
      setToStack: React.Dispatch<React.SetStateAction<HistoryEntry[]>>,
    ) => {
      if (fromStack.length === 0) return;
      const entry = fromStack[fromStack.length - 1];
      setFromStack((s) => s.slice(0, -1));
      setToStack((s) => [
        ...s,
        {
          tokens: mapStateRef.current.tokens,
          revealedZones: mapStateRef.current.revealedZones,
        },
      ]);
      const newState = {
        ...mapStateRef.current,
        tokens: entry.tokens,
        revealedZones: entry.revealedZones,
      };
      mapStateRef.current = newState;
      setMapState(newState);
      transportRef.current?.send({
        type: "TOKENS_UPDATED",
        tokens: entry.tokens,
      });
      transportRef.current?.send({
        type: "FOG_UPDATED",
        revealedZones: entry.revealedZones,
      });
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
        applyZoom(e.deltaY, sx, sy);
      } else if (e.deltaMode === 0) {
        setCamera((c) => ({ ...c, x: c.x - e.deltaX, y: c.y - e.deltaY }));
      } else {
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
        draggingTokenIdRef.current = null;
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
        const changed = e.changedTouches[0];
        const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
        endInteraction(changed.clientX - rect.left, changed.clientY - rect.top);
        lastPinchDistRef.current = null;
        lastPinchCenterRef.current = null;
      } else if (e.touches.length === 1) {
        lastPinchDistRef.current = null;
        lastPinchCenterRef.current = null;
        isPanningRef.current = true;
        lastPanPosRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      }
    },
    [endInteraction],
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
    e.target.value = "";
  }, []);

  const openPlayerView = useCallback(() => {
    window.open(window.location.href, PLAYER_WINDOW_NAME);
  }, []);

  const cursorStyle = isPointerMode
    ? "crosshair"
    : view === "player"
      ? "grab"
      : draggingTokenIdRef.current
        ? "grabbing"
        : "crosshair";

  const selectedToken = mapState.tokens.find((t) => t.id === selectedTokenId);

  return (
    <div className="w-full h-screen bg-black flex flex-col relative overflow-hidden">
      {/* Toolbar */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1 flex-wrap">
        {/* Section 1 — navigation & status */}
        <div className="flex items-center gap-1 bg-panel-bg/90 border border-border-primary rounded-lg px-2 py-1">
          <button
            onClick={() => {
              if (
                mapStateRef.current.imageDataUrl &&
                !window.confirm(
                  "Leave the map? The imported image will be lost.",
                )
              )
                return;
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
          <span className="w-px h-4 bg-border-primary mx-1" />
          <button
            onClick={() => setIsPointerMode((v) => !v)}
            className={`px-2 py-0.5 rounded text-sm transition flex items-center gap-1.5 ${
              isPointerMode
                ? "bg-amber-500 text-white"
                : "text-text-muted hover:text-text-primary"
            }`}
            title="Pointer tool — click to ping a location"
          >
            <MapPin className="w-4 h-4" />
          </button>
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
                  applyHistory(undoStack, setUndoStack, setRedoStack)
                }
                disabled={undoStack.length === 0}
                className="hover:bg-panel-secondary disabled:opacity-40 disabled:cursor-not-allowed text-text-primary px-2 py-1 rounded text-sm transition flex items-center gap-1.5"
                title="Undo"
              >
                <RotateCcw className="w-4 h-4" />
                Undo
              </button>
              <button
                onClick={() =>
                  applyHistory(redoStack, setRedoStack, setUndoStack)
                }
                disabled={redoStack.length === 0}
                className="hover:bg-panel-secondary disabled:opacity-40 disabled:cursor-not-allowed text-text-primary px-2 py-1 rounded text-sm transition flex items-center gap-1.5"
                title="Redo"
              >
                <RotateCcw className="w-4 h-4 scale-x-[-1]" />
                Redo
              </button>
              <button
                onClick={() => {
                  const prevZones = mapStateRef.current.revealedZones;
                  if (prevZones.length === 0) return;
                  setUndoStack((s) => [
                    ...s,
                    {
                      tokens: mapStateRef.current.tokens,
                      revealedZones: prevZones,
                    },
                  ]);
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

            {/* Section 3 — tokens */}
            <div className="flex items-center gap-1 bg-panel-bg/90 border border-border-primary rounded-lg px-2 py-1">
              <button
                onClick={() => {
                  setTokenModalOpen(true);
                  if (!selectedTokenId && mapState.tokens.length > 0) {
                    setSelectedTokenId(mapState.tokens[0].id);
                  }
                }}
                className="hover:bg-panel-secondary text-text-primary px-2 py-1 rounded text-sm transition flex items-center gap-1.5"
                title="Manage tokens"
              >
                <CircleUser className="w-4 h-4" />
                Tokens
                <span className="text-xs text-text-muted tabular-nums">
                  {mapState.tokens.length}
                </span>
              </button>
            </div>

            {/* Section 4 — sync */}
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

      {/* Token management modal */}
      {tokenModalOpen && (
        <div className="absolute inset-0 z-30 bg-black/50 backdrop-blur-sm flex items-start justify-start p-4 pointer-events-none">
          <div className="mt-14 bg-panel-bg border border-border-primary rounded-xl p-4 w-72 flex flex-col gap-3 relative pointer-events-auto shadow-xl max-h-[80vh] overflow-y-auto">
            <button
              onClick={() => setTokenModalOpen(false)}
              className="absolute top-3 right-3 text-text-muted hover:text-text-primary transition"
            >
              <X className="w-4 h-4" />
            </button>
            <h2 className="text-sm font-bold text-text-primary pr-6">Tokens</h2>

            {/* Token list */}
            <div className="flex flex-col gap-1">
              {mapState.tokens.map((token) => (
                <div
                  key={token.id}
                  onClick={() =>
                    setSelectedTokenId(
                      selectedTokenId === token.id ? null : token.id,
                    )
                  }
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition ${
                    selectedTokenId === token.id
                      ? "bg-panel-secondary"
                      : "hover:bg-panel-secondary/50"
                  }`}
                >
                  {/* Color swatch / image preview */}
                  {token.imageDataUrl ? (
                    <img
                      src={token.imageDataUrl}
                      className="w-6 h-6 rounded-full object-cover shrink-0"
                      alt=""
                    />
                  ) : (
                    <span
                      className="w-6 h-6 rounded-full shrink-0 border border-white/20"
                      style={{ background: token.color }}
                    />
                  )}
                  <span className="flex-1 text-xs text-text-primary truncate">
                    {tokenLabel(token)}
                  </span>
                  {/* Hide/reveal toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateToken(token.id, { hidden: !token.hidden });
                    }}
                    className={`p-1 rounded transition ${
                      token.hidden
                        ? "text-text-muted hover:text-amber-400"
                        : "text-green-400 hover:text-text-muted"
                    }`}
                    title={
                      token.hidden
                        ? "Hidden — click to reveal"
                        : "Visible — click to hide"
                    }
                  >
                    {token.hidden ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                  {/* Delete — not for the party token */}
                  {token.id !== "player" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeToken(token.id);
                      }}
                      className="p-1 rounded text-text-muted hover:text-red-400 transition"
                      title="Delete token"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add token */}
            <button
              onClick={addToken}
              className="flex items-center justify-center gap-1.5 bg-panel-secondary hover:bg-panel-secondary/70 text-text-primary px-3 py-1.5 rounded-lg text-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Token
            </button>

            {/* Edit panel for selected token */}
            {selectedToken && (
              <>
                <div className="h-px bg-border-primary" />
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                  Edit: {tokenLabel(selectedToken)}
                </p>

                {/* Label */}
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-text-muted">Label</span>
                  <input
                    type="text"
                    value={selectedToken.label ?? ""}
                    onChange={(e) =>
                      updateToken(selectedToken.id, {
                        label: e.target.value || undefined,
                      })
                    }
                    placeholder="e.g. Goblin 1"
                    className="bg-panel-secondary text-text-primary px-2 py-1 rounded text-xs border border-border-primary focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Color */}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-text-muted">Color</span>
                  <input
                    type="color"
                    value={selectedToken.color}
                    onChange={(e) =>
                      updateToken(selectedToken.id, { color: e.target.value })
                    }
                    className="w-10 h-8 rounded cursor-pointer border border-border-primary bg-transparent"
                  />
                </div>

                {/* Image */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-text-muted">Image</span>
                  <div className="flex items-center gap-2">
                    <label className="flex-1 bg-panel-secondary hover:bg-panel-secondary/70 text-text-primary px-3 py-1.5 rounded text-xs cursor-pointer transition text-center">
                      Upload
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            updateToken(selectedToken.id, {
                              imageDataUrl: ev.target?.result as string,
                            });
                          };
                          reader.readAsDataURL(file);
                          e.target.value = "";
                        }}
                      />
                    </label>
                    {selectedToken.imageDataUrl && (
                      <button
                        onClick={() =>
                          updateToken(selectedToken.id, {
                            imageDataUrl: undefined,
                          })
                        }
                        className="bg-panel-secondary hover:bg-panel-secondary/70 text-text-muted hover:text-text-primary px-3 py-1.5 rounded text-xs transition"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  {selectedToken.imageDataUrl && (
                    <img
                      src={selectedToken.imageDataUrl}
                      className="w-16 h-16 rounded-full object-cover border-2 border-border-primary mx-auto"
                      alt="Token preview"
                    />
                  )}
                </div>

                {/* Size */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted">Size</span>
                    <span className="text-xs tabular-nums text-text-muted">
                      {selectedToken.radius}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={80}
                    value={selectedToken.radius}
                    onChange={(e) =>
                      updateToken(selectedToken.id, {
                        radius: Number(e.target.value),
                      })
                    }
                    className="w-full accent-blue-400"
                  />
                </div>

                {/* Reveals fog */}
                <label className="flex items-center justify-between gap-3 cursor-pointer">
                  <span className="text-xs text-text-muted">Reveals fog</span>
                  <input
                    type="checkbox"
                    checked={selectedToken.revealsFog}
                    onChange={(e) =>
                      updateToken(selectedToken.id, {
                        revealsFog: e.target.checked,
                      })
                    }
                    className="accent-blue-400 w-4 h-4"
                  />
                </label>
              </>
            )}
          </div>
        </div>
      )}

      {/* Disconnected banner */}
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

      {/* Waiting for DM overlay */}
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
        onMouseLeave={() => endInteraction()}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
    </div>
  );
}
