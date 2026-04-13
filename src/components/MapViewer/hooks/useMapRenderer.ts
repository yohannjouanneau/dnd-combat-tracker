import { useEffect, useRef } from "react";
import type { Camera, MapState, PingEntry, Token } from "../types";

const FOG_DM_OPACITY = 0.4;
const FOG_PLAYER_OPACITY = 1;

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
  pingsRef: React.RefObject<PingEntry[]>;
}

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
  pingsRef,
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
      const { tokens: stateTokens, revealedZones } = mapStateRef.current!;

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
        ? stateTokens.find((t) => t.id === draggingId)
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
        view === "dm" ? stateTokens : stateTokens.filter((t) => !t.hidden);

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
  }, [
    view,
    canvasRef,
    cameraRef,
    mapStateRef,
    draggingTokenIdRef,
    draggingTokenPosRef,
    revealRadiusRef,
    pingsRef,
  ]);
}
