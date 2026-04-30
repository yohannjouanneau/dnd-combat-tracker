import { Loader2, X } from "lucide-react";
import Button from "../common/Button";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { MAP_ROOM_CODE_STORAGE_KEY } from "../../constants";
import { dataStore } from "../../persistence/storage";
import PeerJSConnector from "./PeerJSConnector";
import MapToolbar from "./components/MapToolbar";
import TokenModal from "./components/TokenModal";
import { useMapInteraction } from "./hooks/useMapInteraction";
import { useMapRenderer } from "./hooks/useMapRenderer";
import { useMapSync } from "./hooks/useMapSync";
import type {
  Camera,
  HistoryEntry,
  MapState,
  MapTransport,
  PingEntry,
} from "./types";

function centerCameraOn(
  x: number,
  y: number,
  canvas: HTMLCanvasElement,
  scale: number,
) {
  return { x: canvas.width / 2 - x * scale, y: canvas.height / 2 - y * scale };
}

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

export const PLAYER_WINDOW_NAME = "dnd-map-player-view";

export default function MapViewer() {
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [view, setView] = useState<"dm" | "player">(
    window.name === PLAYER_WINDOW_NAME ? "player" : "dm",
  );
  const [peerModalOpen, setPeerModalOpen] = useState(false);
  const [peerTransport, setPeerTransport] = useState<MapTransport | null>(null);
  const [isPeerOnline, setIsPeerOnline] = useState(false);
  const [peerDisconnected, setPeerDisconnected] = useState(false);
  const [lastRoomCode, setLastRoomCode] = useState<string | null>(
    () => localStorage.getItem(MAP_ROOM_CODE_STORAGE_KEY) ?? null,
  );
  const [isReconnecting, setIsReconnecting] = useState(false);

  const [mapState, setMapState] = useState<MapState>(() => {
    const saved = dataStore.getMapState();
    return saved
      ? {
          imageDataUrl: null,
          tokens: saved.tokens,
          revealedZones: saved.revealedZones,
        }
      : DEFAULT_MAP_STATE;
  });
  const [camera, setCamera] = useState<Camera>(() => {
    const saved = dataStore.getMapState();
    return saved?.camera ?? { x: 0, y: 0, scale: 1 };
  });
  const [undoStack, setUndoStack] = useState<HistoryEntry[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryEntry[]>([]);
  const [revealRadius, setRevealRadius] = useState(145);
  const isRadiusPreviewActiveRef = useRef(false);
  const previewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [portraitViewTokenId, setPortraitViewTokenId] = useState<string | null>(
    null,
  );

  // Shared refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapStateRef = useRef(mapState);
  mapStateRef.current = mapState;
  const cameraRef = useRef(camera);
  cameraRef.current = camera;
  const revealRadiusRef = useRef(revealRadius);
  revealRadiusRef.current = revealRadius;
  const transportRef = useRef<MapTransport | null>(null);
  const pingsRef = useRef<PingEntry[]>([]);
  const nextPingIdRef = useRef(0);

  // Persist room code to localStorage so reconnect survives a page refresh
  useEffect(() => {
    if (lastRoomCode) {
      localStorage.setItem(MAP_ROOM_CODE_STORAGE_KEY, lastRoomCode);
    } else {
      localStorage.removeItem(MAP_ROOM_CODE_STORAGE_KEY);
    }
  }, [lastRoomCode]);

  // Auto-save token positions, fog zones, and camera (debounced)
  useEffect(() => {
    if (saveDebounceRef.current !== null) clearTimeout(saveDebounceRef.current);
    saveDebounceRef.current = setTimeout(() => {
      dataStore.setMapState({
        tokens: mapState.tokens.map(
          ({ id, x, y, radius, color, label, hidden, revealsFog }) => ({
            id,
            x,
            y,
            radius,
            color,
            label,
            hidden,
            revealsFog,
          }),
        ),
        revealedZones: mapState.revealedZones,
        camera,
        updatedAt: Date.now(),
      });
    }, 500);
  }, [mapState, camera]);

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

  const { synced, reconnectToRoom } = useMapSync({
    view,
    peerTransport,
    mapStateRef,
    transportRef,
    pingsRef,
    nextPingIdRef,
    setMapState,
    setPeerTransport,
    setPeerDisconnected,
    setIsReconnecting,
    onCenterCamera: useCallback(
      (x: number, y: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        setCamera((prev) => ({
          ...prev,
          ...centerCameraOn(x, y, canvas, prev.scale),
        }));
      },
      [setCamera],
    ),
  });

  const {
    draggingTokenIdRef,
    draggingTokenPosRef,
    isPointerMode,
    isFocusMode,
    setIsPointerMode,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
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
    setIsFocusMode,
    recenterOnPlayer,
  } = useMapInteraction({
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
    onTokenTap: useCallback((tokenId: string) => {
      const token = mapStateRef.current!.tokens.find((t) => t.id === tokenId);
      if (token?.portraitDataUrl) setPortraitViewTokenId(tokenId);
    }, []),
    onFocusToken: useCallback((x: number, y: number) => {
      transportRef.current?.send({ type: "FOCUS_TOKEN", x, y });
    }, []),
  });

  useMapRenderer({
    canvasRef,
    view,
    imageDataUrl: mapState.imageDataUrl,
    tokens: mapState.tokens,
    mapStateRef,
    cameraRef,
    draggingTokenIdRef,
    draggingTokenPosRef,
    revealRadiusRef,
    isRadiusPreviewActiveRef,
    pingsRef,
  });

  const { t } = useTranslation("map");

  // On mount: if we were previously connected as a player, auto-reconnect
  const autoReconnectAttempted = useRef(false);
  useEffect(() => {
    if (autoReconnectAttempted.current) return;
    autoReconnectAttempted.current = true;
    if (view === "player" && lastRoomCode) {
      reconnectToRoom(lastRoomCode);
    }
  }, [view, lastRoomCode, reconnectToRoom]);

  // Auto-reconnect whenever peerDisconnected flips to true (ICE failure, close
  // event, or visibilitychange check). One shot per disconnection — if it fails
  // the user sees the banner and can retry manually.
  const hasAutoReconnectedRef = useRef(false);
  useEffect(() => {
    if (!peerDisconnected) {
      hasAutoReconnectedRef.current = false;
      return;
    }
    if (lastRoomCode && !isReconnecting && !hasAutoReconnectedRef.current) {
      hasAutoReconnectedRef.current = true;
      reconnectToRoom(lastRoomCode);
    }
  }, [peerDisconnected, lastRoomCode, isReconnecting, reconnectToRoom]);

  // Track live connection status without touching peerTransport or room state.
  // WebRTC "close" events are unreliable when the remote tab is killed — ICE
  // can take 30+ seconds to time out. Polling isConnected() (which checks
  // conn.open + ICE state) catches the drop within a few seconds so the
  // indicator clears promptly. The player can still reconnect to the same room.
  useEffect(() => {
    if (!peerTransport) {
      setIsPeerOnline(false);
      return;
    }
    setIsPeerOnline(true);
    const id = setInterval(() => {
      const next = transportRef.current?.isConnected() ?? false;
      setIsPeerOnline((prev) => (prev === next ? prev : next));
    }, 3000);
    return () => clearInterval(id);
  }, [peerTransport]);

  useEffect(() => {
    const handler = () => {
      if (document.visibilityState !== "visible") return;

      const transport = transportRef.current;

      // On device, WebRTC connections die silently when the browser is backgrounded —
      // conn.on("close") never fires. Actively check isConnected() (checks both
      // conn.open and iceConnectionState) when coming back to the foreground.
      // Setting peerDisconnected=true is enough — the effect below handles reconnect.
      if (
        lastRoomCode &&
        !isReconnecting &&
        transport &&
        !transport.isConnected()
      ) {
        setPeerDisconnected(true);
        return;
      }

      if (peerDisconnected && lastRoomCode && !isReconnecting) {
        reconnectToRoom(lastRoomCode);
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [
    peerDisconnected,
    lastRoomCode,
    isReconnecting,
    reconnectToRoom,
    transportRef,
  ]);

  const portraitToken = portraitViewTokenId
    ? (mapState.tokens.find((t) => t.id === portraitViewTokenId) ?? null)
    : null;

  const cursorStyle = isPointerMode
    ? "crosshair"
    : view === "player"
      ? "grab"
      : draggingTokenIdRef.current
        ? "grabbing"
        : "crosshair";

  return (
    <div className="w-full h-screen bg-black flex flex-col relative overflow-hidden">
      <MapToolbar
        view={view}
        cameraScale={camera.scale}
        isPointerMode={isPointerMode}
        onTogglePointerMode={() => setIsPointerMode((v) => !v)}
        isFocusMode={isFocusMode}
        onToggleFocusMode={() => setIsFocusMode((v: boolean) => !v)}
        onRecenterOnPlayer={recenterOnPlayer}
        onBack={handleBack}
        revealRadius={revealRadius}
        onRevealRadiusChange={(r: number) => {
          setRevealRadius(r);
          isRadiusPreviewActiveRef.current = true;
          if (previewTimeoutRef.current)
            clearTimeout(previewTimeoutRef.current);
          previewTimeoutRef.current = setTimeout(() => {
            isRadiusPreviewActiveRef.current = false;
          }, 1500);
        }}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        onUndo={undo}
        onRedo={redo}
        canResetFog={mapState.revealedZones.length > 0}
        onResetFog={resetFog}
        onImport={handleImport}
        tokenCount={mapState.tokens.length}
        onOpenTokenModal={() => {
          setTokenModalOpen(true);
          if (!selectedTokenId && mapState.tokens.length > 0) {
            setSelectedTokenId(mapState.tokens[0].id);
          }
        }}
        onOpenPeerModal={() => setPeerModalOpen(true)}
        isPeerConnected={isPeerOnline}
        isReconnecting={isReconnecting}
      />

      {peerModalOpen && (
        <PeerJSConnector
          onConnected={(transport, role, roomCode) => {
            setPeerTransport(transport);
            if (role === "player") {
              window.name = PLAYER_WINDOW_NAME;
              setView("player");
              if (roomCode) setLastRoomCode(roomCode);
            }
            setPeerDisconnected(false);
            setIsReconnecting(false);
            setPeerModalOpen(false);
          }}
          onOpenLocalView={openPlayerView}
          onClose={() => setPeerModalOpen(false)}
        />
      )}

      {tokenModalOpen && (
        <TokenModal
          tokens={mapState.tokens}
          selectedTokenId={selectedTokenId}
          onSelectToken={setSelectedTokenId}
          onClose={() => setTokenModalOpen(false)}
          onAddToken={addToken}
          onDuplicateToken={duplicateToken}
          onRemoveToken={removeToken}
          onUpdateToken={updateToken}
        />
      )}

      {/* Disconnected / reconnecting banner */}
      {(peerDisconnected || isReconnecting) && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-panel-bg border border-border-primary rounded-lg px-4 py-3 shadow-lg">
          {isReconnecting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-text-muted" />
              <span className="text-sm text-text-primary">
                {t("overlay.reconnecting")}
              </span>
            </>
          ) : (
            <>
              <span className="text-sm text-text-primary">
                {t("overlay.connectionLost")}
              </span>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  if (lastRoomCode) {
                    reconnectToRoom(lastRoomCode);
                  } else {
                    setPeerDisconnected(false);
                    setPeerModalOpen(true);
                  }
                }}
                className="font-semibold"
              >
                {t("overlay.reconnect")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPeerDisconnected(false)}
              >
                {t("overlay.dismiss")}
              </Button>
            </>
          )}
        </div>
      )}

      {/* Waiting for DM overlay */}
      {view === "player" && !synced && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/90 z-20">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/70 text-sm">{t("overlay.waitingForDm")}</p>
          <p className="text-white/30 text-xs">
            {t("overlay.waitingForDmHint")}
          </p>
        </div>
      )}

      {/* Helper text when no map is loaded */}
      {!mapState.imageDataUrl && view === "dm" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-white/30 text-lg select-none">
            {t("overlay.importMapHint")}
          </p>
        </div>
      )}

      {portraitToken?.portraitDataUrl && (
        <div
          className="absolute inset-0 z-40 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPortraitViewTokenId(null)}
        >
          <button
            onClick={() => setPortraitViewTokenId(null)}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={portraitToken.portraitDataUrl}
            alt={portraitToken.label ?? ""}
            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ cursor: cursorStyle, touchAction: "none" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
}
