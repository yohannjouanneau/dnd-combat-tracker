import { useEffect, useRef, useState } from "react";
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
  const [revealRadius, setRevealRadius] = useState(80);
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);

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
  });

  const {
    draggingTokenIdRef,
    draggingTokenPosRef,
    isPointerMode,
    setIsPointerMode,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    updateToken,
    addToken,
    removeToken,
    undo,
    redo,
    resetFog,
    handleImport,
    openPlayerView,
    handleBack,
  } = useMapInteraction({
    view,
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

      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ cursor: cursorStyle, touchAction: "none" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
    </div>
  );
}
