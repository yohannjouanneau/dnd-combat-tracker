import { X } from "lucide-react";

function centerCameraOn(
  x: number,
  y: number,
  canvas: HTMLCanvasElement,
  scale: number,
) {
  return { x: canvas.width / 2 - x * scale, y: canvas.height / 2 - y * scale };
}
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
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
  const [view, setView] = useState<"dm" | "player">(
    window.name === PLAYER_WINDOW_NAME ? "player" : "dm",
  );
  const [peerModalOpen, setPeerModalOpen] = useState(false);
  const [peerTransport, setPeerTransport] = useState<MapTransport | null>(null);
  const [peerDisconnected, setPeerDisconnected] = useState(false);

  const [mapState, setMapState] = useState<MapState>(DEFAULT_MAP_STATE);
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, scale: 1 });
  const [undoStack, setUndoStack] = useState<HistoryEntry[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryEntry[]>([]);
  const [revealRadius, setRevealRadius] = useState(145);
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

  const { synced } = useMapSync({
    view,
    peerTransport,
    mapStateRef,
    transportRef,
    pingsRef,
    nextPingIdRef,
    setMapState,
    setPeerTransport,
    setPeerDisconnected,
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
    undo,
    redo,
    resetFog,
    handleImport,
    openPlayerView,
    handleBack,
    setIsFocusMode,
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
    pingsRef,
  });

  const recenterOnPlayer = useCallback(() => {
    const tokens = mapStateRef.current!.tokens;
    const token =
      tokens.find((t) => t.id === "player") ?? tokens.find((t) => !t.hidden);
    if (!token) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    setCamera((prev) => ({
      ...prev,
      ...centerCameraOn(token.x, token.y, canvas, prev.scale),
    }));
  }, [mapStateRef, setCamera]);

  const { t } = useTranslation("map");

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
        onRevealRadiusChange={setRevealRadius}
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
        onOpenPlayerView={openPlayerView}
        onOpenPeerModal={() => setPeerModalOpen(true)}
      />

      {peerModalOpen && (
        <PeerJSConnector
          onConnected={(transport, role) => {
            setPeerTransport(transport);
            if (role === "player") {
              window.name = PLAYER_WINDOW_NAME;
              setView("player");
            }
            setPeerModalOpen(false);
          }}
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
          onRemoveToken={removeToken}
          onUpdateToken={updateToken}
        />
      )}

      {/* Disconnected banner */}
      {peerDisconnected && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-panel-bg border border-border-primary rounded-lg px-4 py-3 shadow-lg">
          <span className="text-sm text-text-primary">
            {t("overlay.connectionLost")}
          </span>
          <button
            onClick={() => {
              setPeerDisconnected(false);
              setPeerModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition font-semibold"
          >
            {t("overlay.reconnect")}
          </button>
          <button
            onClick={() => setPeerDisconnected(false)}
            className="text-text-muted hover:text-text-primary transition text-sm"
          >
            {t("overlay.dismiss")}
          </button>
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
