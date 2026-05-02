import i18n from "i18next";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { PLAYER_WINDOW_NAME } from "../MapViewer";
import type {
  Camera,
  HistoryEntry,
  MapState,
  MapTransport,
  PingEntry,
  RevealedZone,
  Token,
} from "../types";

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

function findClosestToken(
  tokens: Token[],
  worldX: number,
  worldY: number,
): Token | null {
  let closest: Token | null = null;
  let closestDist = Infinity;
  for (const token of tokens) {
    const d = Math.hypot(worldX - token.x, worldY - token.y);
    if (d <= token.radius * 1.5 && d < closestDist) {
      closestDist = d;
      closest = token;
    }
  }
  return closest;
}

interface Params {
  view: "dm" | "player";
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  mapStateRef: React.RefObject<MapState>;
  cameraRef: React.RefObject<Camera>;
  transportRef: React.RefObject<MapTransport | null>;
  revealRadiusRef: React.RefObject<number>;
  pingsRef: React.RefObject<PingEntry[]>;
  nextPingIdRef: React.RefObject<number>;
  undoStack: HistoryEntry[];
  redoStack: HistoryEntry[];
  setMapState: React.Dispatch<React.SetStateAction<MapState>>;
  setCamera: React.Dispatch<React.SetStateAction<Camera>>;
  setUndoStack: React.Dispatch<React.SetStateAction<HistoryEntry[]>>;
  setRedoStack: React.Dispatch<React.SetStateAction<HistoryEntry[]>>;
  setSelectedTokenId: React.Dispatch<React.SetStateAction<string | null>>;
  onTokenTap: (tokenId: string) => void;
  onFocusToken: (x: number, y: number) => void;
  onContextMenuToken: (tokenId: string, x: number, y: number) => void;
  onBeforeBack: () => void;
}

export function useMapInteraction({
  view,
  canvasRef,
  mapStateRef,
  cameraRef,
  transportRef,
  revealRadiusRef,
  pingsRef,
  nextPingIdRef,
  undoStack,
  redoStack,
  setMapState,
  setCamera,
  setUndoStack,
  setRedoStack,
  setSelectedTokenId,
  onTokenTap,
  onFocusToken,
  onContextMenuToken,
  onBeforeBack,
}: Params) {
  // Owned refs — internal to interaction logic
  const draggingTokenIdRef = useRef<string | null>(null);
  const draggingTokenPosRef = useRef<{ x: number; y: number } | null>(null);
  const tokenDragStartScreenRef = useRef<{ sx: number; sy: number } | null>(
    null,
  );
  const tapTokenIdRef = useRef<string | null>(null);
  const isPanningRef = useRef(false);
  const lastPanPosRef = useRef({ x: 0, y: 0 });
  const pointerDownScreenRef = useRef<{ sx: number; sy: number } | null>(null);
  const lastPinchDistRef = useRef<number | null>(null);
  const lastPinchCenterRef = useRef<{ x: number; y: number } | null>(null);

  const [isPointerMode, setIsPointerMode] = useState(false);
  const isPointerModeRef = useRef(isPointerMode);
  isPointerModeRef.current = isPointerMode;

  const [isFocusMode, setIsFocusMode] = useState(false);
  const isFocusModeRef = useRef(isFocusMode);
  isFocusModeRef.current = isFocusMode;

  // --- Ping ---

  const emitPing = useCallback(
    (sx: number, sy: number) => {
      const { x, y } = screenToWorld(sx, sy, cameraRef.current!);
      pingsRef.current.push({
        id: nextPingIdRef.current++,
        x,
        y,
        startedAt: performance.now(),
      });
      transportRef.current?.send({ type: "POINTER_PING", x, y });
    },
    [cameraRef, pingsRef, nextPingIdRef, transportRef],
  );

  // --- Pointer interactions ---

  const startPointerInteraction = useCallback(
    (sx: number, sy: number, clientX: number, clientY: number) => {
      if (isPointerModeRef.current) {
        pointerDownScreenRef.current = { sx, sy };
        isPanningRef.current = true;
        lastPanPosRef.current = { x: clientX, y: clientY };
        return;
      }
      const world = screenToWorld(sx, sy, cameraRef.current!);
      const { tokens } = mapStateRef.current!;
      const visibleTokens =
        view === "player" ? tokens.filter((t) => !t.hidden) : tokens;
      const closest = findClosestToken(visibleTokens, world.x, world.y);
      if (closest) {
        tapTokenIdRef.current = closest.id;
        tokenDragStartScreenRef.current = { sx, sy };
        if (view === "dm") {
          draggingTokenIdRef.current = closest.id;
          draggingTokenPosRef.current = { x: closest.x, y: closest.y };
          return;
        }
      }
      isPanningRef.current = true;
      lastPanPosRef.current = { x: clientX, y: clientY };
    },
    [view, cameraRef, mapStateRef],
  );

  const updatePointerInteraction = useCallback(
    (sx: number, sy: number, clientX: number, clientY: number) => {
      if (draggingTokenIdRef.current) {
        draggingTokenPosRef.current = screenToWorld(sx, sy, cameraRef.current!);
      } else if (isPanningRef.current) {
        const dx = clientX - lastPanPosRef.current.x;
        const dy = clientY - lastPanPosRef.current.y;
        lastPanPosRef.current = { x: clientX, y: clientY };
        setCamera((c) => ({ ...c, x: c.x + dx, y: c.y + dy }));
      }
    },
    [cameraRef, setCamera],
  );

  const endInteraction = useCallback(
    (sx?: number, sy?: number) => {
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

      const tapTokenId = tapTokenIdRef.current;
      const dragStart = tokenDragStartScreenRef.current;
      tapTokenIdRef.current = null;
      tokenDragStartScreenRef.current = null;
      if (
        tapTokenId &&
        dragStart &&
        sx !== undefined &&
        sy !== undefined &&
        Math.hypot(sx - dragStart.sx, sy - dragStart.sy) < 6
      ) {
        draggingTokenIdRef.current = null;
        draggingTokenPosRef.current = null;
        isPanningRef.current = false;
        if (isFocusModeRef.current) {
          const token = mapStateRef.current!.tokens.find(
            (t) => t.id === tapTokenId,
          );
          if (token) onFocusToken(token.x, token.y);
          setIsFocusMode(false);
          return;
        }
        onTokenTap(tapTokenId);
        return;
      }

      if (draggingTokenIdRef.current !== null) {
        const tokenId = draggingTokenIdRef.current;
        draggingTokenIdRef.current = null;
        const finalPos = draggingTokenPosRef.current;
        draggingTokenPosRef.current = null;

        if (finalPos) {
          const prevTokens = mapStateRef.current!.tokens;
          const draggingToken = prevTokens.find((t) => t.id === tokenId);
          if (draggingToken) {
            const tokens = prevTokens.map((t) =>
              t.id === tokenId ? { ...t, ...finalPos } : t,
            );
            const prevZones = mapStateRef.current!.revealedZones;
            const revealedZones: RevealedZone[] = draggingToken.revealsFog
              ? [
                  ...prevZones,
                  {
                    x: finalPos.x,
                    y: finalPos.y,
                    radius: revealRadiusRef.current,
                  },
                ]
              : prevZones;

            mapStateRef.current = {
              ...mapStateRef.current!,
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
    [
      emitPing,
      onTokenTap,
      onFocusToken,
      mapStateRef,
      revealRadiusRef,
      transportRef,
      setMapState,
      setUndoStack,
      setRedoStack,
    ],
  );

  // --- Context menu ---

  const handleContextMenu = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (view !== "dm") return;
      e.preventDefault();
      const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
      const world = screenToWorld(
        e.clientX - rect.left,
        e.clientY - rect.top,
        cameraRef.current!,
      );
      const { tokens } = mapStateRef.current!;
      const closest = findClosestToken(tokens, world.x, world.y);
      if (closest) onContextMenuToken(closest.id, e.clientX, e.clientY);
    },
    [view, cameraRef, mapStateRef, onContextMenuToken],
  );

  // --- Mouse handlers ---

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

  const handleMouseLeave = useCallback(() => {
    endInteraction();
  }, [endInteraction]);

  // --- Zoom ---

  const applyZoom = useCallback(
    (deltaY: number, sx: number, sy: number) => {
      const zoomFactor = Math.pow(0.999, deltaY);
      const world = screenToWorld(sx, sy, cameraRef.current!);
      setCamera((c) => {
        const newScale = Math.min(5, Math.max(0.1, c.scale * zoomFactor));
        return {
          scale: newScale,
          x: sx - world.x * newScale,
          y: sy - world.y * newScale,
        };
      });
    },
    [cameraRef, setCamera],
  );

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      if (e.ctrlKey || e.shiftKey) {
        applyZoom(e.deltaY * 3, sx, sy);
      } else if (e.deltaMode === 0) {
        setCamera((c) => ({ ...c, x: c.x - e.deltaX, y: c.y - e.deltaY }));
      } else {
        applyZoom(e.deltaY, sx, sy);
      }
    },
    [applyZoom, setCamera],
  );

  // --- Touch handlers ---

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
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
    (e: TouchEvent) => {
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
        const world = screenToWorld(sx, sy, cameraRef.current!);
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
    [cameraRef, setCamera, updatePointerInteraction],
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
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

  // Register wheel/touch listeners as non-passive so preventDefault() blocks
  // browser pinch-to-zoom and page-scroll gestures.
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const opts = { passive: false } as const;
    canvas.addEventListener("wheel", handleWheel, opts);
    canvas.addEventListener("touchstart", handleTouchStart, opts);
    canvas.addEventListener("touchmove", handleTouchMove, opts);
    canvas.addEventListener("touchend", handleTouchEnd, opts);
    return () => {
      canvas.removeEventListener("wheel", handleWheel);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
    };
  }, [
    canvasRef,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  ]);

  // --- Token CRUD ---

  const updateToken = useCallback(
    (id: string, patch: Partial<Token>) => {
      const tokens = mapStateRef.current!.tokens.map((t) =>
        t.id === id ? { ...t, ...patch } : t,
      );
      mapStateRef.current = { ...mapStateRef.current!, tokens };
      setMapState(mapStateRef.current);
      transportRef.current?.send({ type: "TOKENS_UPDATED", tokens });
    },
    [mapStateRef, transportRef, setMapState],
  );

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
    const tokens = [...mapStateRef.current!.tokens, newToken];
    mapStateRef.current = { ...mapStateRef.current!, tokens };
    setMapState(mapStateRef.current);
    transportRef.current?.send({ type: "TOKENS_UPDATED", tokens });
    setSelectedTokenId(id);
  }, [mapStateRef, transportRef, setMapState, setSelectedTokenId]);

  const removeToken = useCallback(
    (id: string) => {
      const tokens = mapStateRef.current!.tokens.filter((t) => t.id !== id);
      mapStateRef.current = { ...mapStateRef.current!, tokens };
      setMapState(mapStateRef.current);
      transportRef.current?.send({ type: "TOKENS_UPDATED", tokens });
      setSelectedTokenId((prev) => (prev === id ? null : prev));
    },
    [mapStateRef, transportRef, setMapState, setSelectedTokenId],
  );

  const duplicateToken = useCallback(
    (id: string) => {
      const source = mapStateRef.current!.tokens.find((t) => t.id === id);
      if (!source) return;
      const newId = crypto.randomUUID();
      const copy: Token = {
        ...source,
        id: newId,
        x: source.x + 30,
        y: source.y + 30,
      };
      const tokens = [...mapStateRef.current!.tokens, copy];
      mapStateRef.current = { ...mapStateRef.current!, tokens };
      setMapState(mapStateRef.current);
      transportRef.current?.send({ type: "TOKENS_UPDATED", tokens });
      setSelectedTokenId(newId);
    },
    [mapStateRef, transportRef, setMapState, setSelectedTokenId],
  );

  // --- History ---

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    const entry = undoStack[undoStack.length - 1];
    setUndoStack((s) => s.slice(0, -1));
    setRedoStack((s) => [
      ...s,
      {
        tokens: mapStateRef.current!.tokens,
        revealedZones: mapStateRef.current!.revealedZones,
      },
    ]);
    const newState = {
      ...mapStateRef.current!,
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
  }, [
    undoStack,
    mapStateRef,
    transportRef,
    setMapState,
    setUndoStack,
    setRedoStack,
  ]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    const entry = redoStack[redoStack.length - 1];
    setRedoStack((s) => s.slice(0, -1));
    setUndoStack((s) => [
      ...s,
      {
        tokens: mapStateRef.current!.tokens,
        revealedZones: mapStateRef.current!.revealedZones,
      },
    ]);
    const newState = {
      ...mapStateRef.current!,
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
  }, [
    redoStack,
    mapStateRef,
    transportRef,
    setMapState,
    setUndoStack,
    setRedoStack,
  ]);

  // --- Fog ---

  const resetFog = useCallback(() => {
    const prevZones = mapStateRef.current!.revealedZones;
    if (prevZones.length === 0) return;
    setUndoStack((s) => [
      ...s,
      { tokens: mapStateRef.current!.tokens, revealedZones: prevZones },
    ]);
    setRedoStack([]);
    const revealedZones: RevealedZone[] = [];
    const newState = { ...mapStateRef.current!, revealedZones };
    mapStateRef.current = newState;
    setMapState(newState);
    transportRef.current?.send({ type: "FOG_UPDATED", revealedZones });
  }, [mapStateRef, transportRef, setMapState, setUndoStack, setRedoStack]);

  // --- Map / navigation ---

  const handleImport = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const imageDataUrl = ev.target?.result as string;
        const newState: MapState = {
          ...mapStateRef.current!,
          imageDataUrl,
          revealedZones: [],
        };
        mapStateRef.current = newState;
        setMapState(newState);
        transportRef.current?.send({ type: "MAP_LOADED", imageDataUrl });
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    },
    [mapStateRef, transportRef, setMapState],
  );

  const openPlayerView = useCallback(() => {
    window.open(window.location.href, PLAYER_WINDOW_NAME);
  }, []);

  const handleBack = useCallback(() => {
    if (
      mapStateRef.current!.imageDataUrl &&
      !window.confirm(i18n.t("map:confirm.leaveMap"))
    )
      return;
    onBeforeBack();
    location.hash = "";
  }, [mapStateRef, onBeforeBack]);

  const recenterOnPlayer = useCallback(() => {
    const tokens = mapStateRef.current!.tokens;
    const token =
      tokens.find((t) => t.id === "player") ?? tokens.find((t) => !t.hidden);
    if (!token) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    setCamera((prev) => ({
      ...prev,
      x: canvas.width / 2 - token.x * prev.scale,
      y: canvas.height / 2 - token.y * prev.scale,
    }));
  }, [mapStateRef, canvasRef, setCamera]);

  return {
    draggingTokenIdRef,
    draggingTokenPosRef,
    isPointerMode,
    isFocusMode,
    setIsFocusMode,
    setIsPointerMode,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleContextMenu,
    updateToken,
    addToken,
    removeToken,
    duplicateToken,
    undo,
    redo,
    resetFog,
    handleImport,
    openPlayerView,
    handleBack,
    recenterOnPlayer,
  };
}
