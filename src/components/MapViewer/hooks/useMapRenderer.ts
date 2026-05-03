import { useEffect, useRef } from "react";
import type { Camera, MapState, PingEntry, RoomPolygon, Token } from "../types";

const FOG_DM_OPACITY = 0.4;
const PLACEHOLDER_SIZE = 2000;
const FOG_PLAYER_OPACITY = 1;
const PING_DURATION = 1200;

interface Params {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  view: "dm" | "player";
  // Reactive values — trigger image loading effects
  imageDataUrl: string | null;
  tokens: Token[];
  // Refs — read in RAF without subscribing
  mapStateRef: React.RefObject<MapState>;
  cameraRef: React.RefObject<Camera>;
  draggingTokenIdRef: React.RefObject<string | null>;
  draggingTokenPosRef: React.RefObject<{ x: number; y: number } | null>;
  revealRadiusRef: React.RefObject<number>;
  isRadiusPreviewActiveRef: React.RefObject<boolean>;
  pingsRef: React.RefObject<PingEntry[]>;
  isRoomDrawModeRef: React.RefObject<boolean>;
  inProgressRoomPointsRef: React.RefObject<{ x: number; y: number }[]>;
  roomHoverPosRef: React.RefObject<{ x: number; y: number } | null>;
  draggingRoomVertexRef: React.RefObject<{
    roomId: string;
    pointIndex: number;
  } | null>;
  highlightedRoomIdRef: React.RefObject<string | null>;
}

// --- Internal render steps ---

function drawMap(
  ctx: CanvasRenderingContext2D,
  mapImg: HTMLImageElement | null,
  scale: number,
  panX: number,
  panY: number,
) {
  ctx.setTransform(scale, 0, 0, scale, panX, panY);
  if (mapImg) {
    ctx.drawImage(mapImg, 0, 0);
    return;
  }
  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(0, 0, PLACEHOLDER_SIZE, PLACEHOLDER_SIZE);
  ctx.strokeStyle = "#2a2a4e";
  ctx.lineWidth = 1 / scale;
  for (let x = 0; x <= PLACEHOLDER_SIZE; x += 50) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, PLACEHOLDER_SIZE);
    ctx.stroke();
  }
  for (let y = 0; y <= PLACEHOLDER_SIZE; y += 50) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(PLACEHOLDER_SIZE, y);
    ctx.stroke();
  }
}

// Ray-casting point-in-polygon test (world coordinates)
function pointInPolygon(
  x: number,
  y: number,
  points: { x: number; y: number }[],
): boolean {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i].x,
      yi = points[i].y;
    const xj = points[j].x,
      yj = points[j].y;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function drawFog(
  ctx: CanvasRenderingContext2D,
  fogCanvasRef: React.RefObject<OffscreenCanvas | null>,
  w: number,
  h: number,
  scale: number,
  panX: number,
  panY: number,
  view: "dm" | "player",
  tokens: Token[],
  revealedZones: MapState["revealedZones"],
  rooms: RoomPolygon[],
  draggingTokenIdRef: React.RefObject<string | null>,
  draggingTokenPosRef: React.RefObject<{ x: number; y: number } | null>,
  revealRadiusRef: React.RefObject<number>,
) {
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

    const validRooms = rooms.filter((r) => r.points.length >= 3);

    const drawZone = (x: number, y: number, radius: number) => {
      const grad = fogCtx.createRadialGradient(x, y, 0, x, y, radius);
      grad.addColorStop(0, "rgba(0,0,0,1)");
      grad.addColorStop(0.7, "rgba(0,0,0,0.8)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      fogCtx.fillStyle = grad;
      fogCtx.beginPath();
      fogCtx.arc(x, y, radius, 0, Math.PI * 2);
      fogCtx.fill();
    };

    // Per-zone clipping: a zone is clipped only if its centre falls inside a
    // room polygon. Zones placed outside rooms (or before rooms were drawn)
    // keep their original circle shape — drawing a room never re-fogs already
    // revealed areas.
    const drawZoneMaybeClipped = (x: number, y: number, radius: number) => {
      if (validRooms.length === 0) {
        drawZone(x, y, radius);
        return;
      }
      const containing = validRooms.filter((r) =>
        pointInPolygon(x, y, r.points),
      );
      if (containing.length === 0) {
        // Outside every room — draw as plain circle
        drawZone(x, y, radius);
        return;
      }
      // Inside one or more rooms — clip circle to those rooms
      fogCtx.save();
      fogCtx.beginPath();
      for (const room of containing) {
        fogCtx.moveTo(room.points[0].x, room.points[0].y);
        for (const p of room.points.slice(1)) fogCtx.lineTo(p.x, p.y);
        fogCtx.closePath();
      }
      fogCtx.clip("evenodd");
      drawZone(x, y, radius);
      fogCtx.restore();
      // restore() resets globalCompositeOperation — re-apply
      fogCtx.globalCompositeOperation = "destination-out";
    };

    for (const zone of revealedZones) {
      drawZoneMaybeClipped(zone.x, zone.y, zone.radius);
    }
    if (showDragFog) {
      drawZoneMaybeClipped(dragPos.x, dragPos.y, revealRadiusRef.current!);
    }
    fogCtx.restore();
  }

  ctx.globalAlpha = view === "dm" ? FOG_DM_OPACITY : FOG_PLAYER_OPACITY;
  ctx.drawImage(fogCanvasRef.current, 0, 0);
  ctx.globalAlpha = 1;
}

function drawRooms(
  ctx: CanvasRenderingContext2D,
  scale: number,
  panX: number,
  panY: number,
  rooms: RoomPolygon[],
  isRoomDrawModeRef: React.RefObject<boolean>,
  inProgressRoomPointsRef: React.RefObject<{ x: number; y: number }[]>,
  roomHoverPosRef: React.RefObject<{ x: number; y: number } | null>,
  draggingRoomVertexRef: React.RefObject<{
    roomId: string;
    pointIndex: number;
  } | null>,
  highlightedRoomIdRef: React.RefObject<string | null>,
) {
  const isDrawMode = isRoomDrawModeRef.current;
  if (rooms.length === 0 && !isDrawMode) return;

  ctx.setTransform(scale, 0, 0, scale, panX, panY);

  const hover = roomHoverPosRef.current;
  const dv = draggingRoomVertexRef.current;
  const highlightedId = highlightedRoomIdRef.current;

  // Draw completed room outlines + vertex handles in draw mode
  for (const room of rooms) {
    if (room.points.length < 3) continue;

    const isHighlighted = room.id === highlightedId;

    // Outline (use drag-adjusted position for the vertex being dragged)
    ctx.beginPath();
    for (let i = 0; i < room.points.length; i++) {
      const isDraggingThis = dv?.roomId === room.id && dv?.pointIndex === i;
      const pos = isDraggingThis && hover ? hover : room.points[i];
      if (i === 0) ctx.moveTo(pos.x, pos.y);
      else ctx.lineTo(pos.x, pos.y);
    }
    ctx.closePath();
    ctx.fillStyle = isHighlighted
      ? "rgba(96, 165, 250, 0.18)"
      : "rgba(96, 165, 250, 0.07)";
    ctx.fill();
    ctx.strokeStyle = isHighlighted
      ? "rgba(96, 165, 250, 0.95)"
      : "rgba(96, 165, 250, 0.55)";
    ctx.lineWidth = (isHighlighted ? 2 : 1.5) / scale;
    if (!isHighlighted) ctx.setLineDash([4 / scale, 3 / scale]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Vertex handles (only in draw mode)
    if (isDrawMode) {
      for (let i = 0; i < room.points.length; i++) {
        const isDraggingThis = dv?.roomId === room.id && dv?.pointIndex === i;
        const pos = isDraggingThis && hover ? hover : room.points[i];
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 6 / scale, 0, Math.PI * 2);
        ctx.fillStyle = isDraggingThis ? "#f97316" : "#60a5fa";
        ctx.fill();
        ctx.strokeStyle = isDraggingThis ? "#7c2d12" : "#1e3a8a";
        ctx.lineWidth = 1.5 / scale;
        ctx.stroke();
      }
    }
  }

  // Draw in-progress polygon while in draw mode
  if (isDrawMode) {
    const pts = inProgressRoomPointsRef.current;
    const hover = roomHoverPosRef.current;

    // Hover crosshair — visible immediately when moving the mouse, even before
    // any vertex is placed so the DM gets immediate feedback that draw mode works
    if (hover) {
      const arm = 10 / scale;
      ctx.strokeStyle = "rgba(250, 204, 21, 0.9)";
      ctx.lineWidth = 1.5 / scale;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(hover.x - arm, hover.y);
      ctx.lineTo(hover.x + arm, hover.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(hover.x, hover.y - arm);
      ctx.lineTo(hover.x, hover.y + arm);
      ctx.stroke();
    }

    if (pts.length > 0) {
      // Lines connecting placed vertices, then a ghost line to the cursor
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (const p of pts.slice(1)) ctx.lineTo(p.x, p.y);
      if (hover) ctx.lineTo(hover.x, hover.y);
      ctx.strokeStyle = "rgba(250, 204, 21, 0.85)";
      ctx.lineWidth = 1.5 / scale;
      ctx.setLineDash([4 / scale, 3 / scale]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Vertex dots
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        const isFirst = i === 0;
        const nearFirst =
          isFirst &&
          hover !== null &&
          pts.length >= 3 &&
          Math.hypot(hover.x - pts[0].x, hover.y - pts[0].y) * scale < 15;

        ctx.beginPath();
        ctx.arc(p.x, p.y, 6 / scale, 0, Math.PI * 2);
        ctx.fillStyle = nearFirst ? "#4ade80" : "#fbbf24";
        ctx.fill();
        ctx.strokeStyle = nearFirst ? "#166534" : "#92400e";
        ctx.lineWidth = 1.5 / scale;
        ctx.stroke();

        // Highlight ring on snap — signals "click here to close"
        if (nearFirst) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 12 / scale, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(74, 222, 128, 0.7)";
          ctx.lineWidth = 2 / scale;
          ctx.stroke();
        }
      }
    }
  }
}

function drawTokens(
  ctx: CanvasRenderingContext2D,
  scale: number,
  panX: number,
  panY: number,
  view: "dm" | "player",
  tokens: Token[],
  tokenImagesRef: React.RefObject<Map<string, HTMLImageElement>>,
  draggingTokenIdRef: React.RefObject<string | null>,
  draggingTokenPosRef: React.RefObject<{ x: number; y: number } | null>,
) {
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
      ? tokenImagesRef.current!.get(token.imageDataUrl)
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
}

function drawRadiusPreview(
  ctx: CanvasRenderingContext2D,
  scale: number,
  panX: number,
  panY: number,
  tokens: Token[],
  revealRadiusRef: React.RefObject<number>,
) {
  const radius = revealRadiusRef.current!;
  ctx.setTransform(scale, 0, 0, scale, panX, panY);
  ctx.setLineDash([6 / scale, 4 / scale]);
  ctx.strokeStyle = "rgba(96, 165, 250, 0.85)";
  ctx.lineWidth = 2 / scale;
  for (const token of tokens) {
    if (!token.revealsFog) continue;
    ctx.beginPath();
    ctx.arc(token.x, token.y, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

function drawPings(
  ctx: CanvasRenderingContext2D,
  scale: number,
  panX: number,
  panY: number,
  pingsRef: React.RefObject<PingEntry[]>,
) {
  const now = performance.now();
  pingsRef.current = pingsRef.current!.filter(
    (p) => now - p.startedAt < PING_DURATION,
  );
  if (pingsRef.current!.length === 0) return;

  ctx.setTransform(scale, 0, 0, scale, panX, panY);
  for (const ping of pingsRef.current!) {
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

// --- Hook ---

export function useMapRenderer({
  canvasRef,
  view,
  imageDataUrl,
  tokens,
  mapStateRef,
  cameraRef,
  draggingTokenIdRef,
  draggingTokenPosRef,
  revealRadiusRef,
  isRadiusPreviewActiveRef,
  pingsRef,
  isRoomDrawModeRef,
  inProgressRoomPointsRef,
  roomHoverPosRef,
  draggingRoomVertexRef,
  highlightedRoomIdRef,
}: Params): void {
  const fogCanvasRef = useRef<OffscreenCanvas | null>(null);
  const mapImageRef = useRef<HTMLImageElement | null>(null);
  const tokenImagesRef = useRef<Map<string, HTMLImageElement>>(new Map());

  // Load map image
  useEffect(() => {
    if (!imageDataUrl) {
      mapImageRef.current = null;
      return;
    }
    const img = new Image();
    img.src = imageDataUrl;
    img.onload = () => {
      mapImageRef.current = img;
    };
  }, [imageDataUrl]);

  // Load/update token images (keyed by dataUrl)
  useEffect(() => {
    const usedUrls = new Set<string>();
    for (const token of tokens) {
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
    for (const url of tokenImagesRef.current.keys()) {
      if (!usedUrls.has(url)) tokenImagesRef.current.delete(url);
    }
  }, [tokens]);

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
  }, [canvasRef]);

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

      const { x: panX, y: panY, scale } = cameraRef.current!;
      const {
        tokens: stateTokens,
        revealedZones,
        rooms,
      } = mapStateRef.current!;

      // 1. Clear
      ctx.clearRect(0, 0, w, h);

      // 2. Map image / placeholder grid
      drawMap(ctx, mapImageRef.current, scale, panX, panY);

      // 3. Fog layer
      drawFog(
        ctx,
        fogCanvasRef,
        w,
        h,
        scale,
        panX,
        panY,
        view,
        stateTokens,
        revealedZones,
        rooms,
        draggingTokenIdRef,
        draggingTokenPosRef,
        revealRadiusRef,
      );

      // 4. Room overlays (DM only — always rendered above fog so boundaries stay visible)
      if (view === "dm") {
        drawRooms(
          ctx,
          scale,
          panX,
          panY,
          rooms,
          isRoomDrawModeRef,
          inProgressRoomPointsRef,
          roomHoverPosRef,
          draggingRoomVertexRef,
          highlightedRoomIdRef,
        );
      }

      // 5. Tokens
      drawTokens(
        ctx,
        scale,
        panX,
        panY,
        view,
        stateTokens,
        tokenImagesRef,
        draggingTokenIdRef,
        draggingTokenPosRef,
      );

      // 6. Radius preview (while adjusting the slider)
      if (isRadiusPreviewActiveRef.current && view === "dm") {
        drawRadiusPreview(ctx, scale, panX, panY, stateTokens, revealRadiusRef);
      }

      // 7. Pointer pings
      drawPings(ctx, scale, panX, panY, pingsRef);

      // 8. Reset transform
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      rafId = requestAnimationFrame(render);
    }

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [
    view,
    canvasRef,
    cameraRef,
    mapStateRef,
    draggingTokenIdRef,
    draggingTokenPosRef,
    revealRadiusRef,
    isRadiusPreviewActiveRef,
    pingsRef,
    isRoomDrawModeRef,
    inProgressRoomPointsRef,
    roomHoverPosRef,
    draggingRoomVertexRef,
    highlightedRoomIdRef,
  ]);
}
