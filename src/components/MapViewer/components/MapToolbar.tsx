import {
  CircleUser,
  MapPin,
  RotateCcw,
  Trash2,
  Upload,
  Wifi,
} from "lucide-react";

interface Props {
  // Section 1 — nav & status
  view: "dm" | "player";
  cameraScale: number;
  isPointerMode: boolean;
  onTogglePointerMode: () => void;
  onBack: () => void;
  // Section 2 — fog controls (DM only)
  revealRadius: number;
  onRevealRadiusChange: (r: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  canResetFog: boolean;
  onResetFog: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  // Section 3 — tokens (DM only)
  tokenCount: number;
  onOpenTokenModal: () => void;
  // Section 4 — sync (DM only)
  onOpenPlayerView: () => void;
  onOpenPeerModal: () => void;
}

export default function MapToolbar({
  view,
  cameraScale,
  isPointerMode,
  onTogglePointerMode,
  onBack,
  revealRadius,
  onRevealRadiusChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  canResetFog,
  onResetFog,
  onImport,
  tokenCount,
  onOpenTokenModal,
  onOpenPlayerView,
  onOpenPeerModal,
}: Props) {
  return (
    <div className="absolute top-3 left-3 z-10 flex items-center gap-1 flex-wrap">
      {/* Section 1 — navigation & status */}
      <div className="flex items-center gap-1 bg-panel-bg/90 border border-border-primary rounded-lg px-2 py-1">
        <button
          onClick={onBack}
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
          {Math.round(cameraScale * 100)}%
        </span>
        <span className="w-px h-4 bg-border-primary mx-1" />
        <button
          onClick={onTogglePointerMode}
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
                onChange={onImport}
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
                onChange={(e) => onRevealRadiusChange(Number(e.target.value))}
                className="w-20 accent-blue-400"
              />
              <span className="tabular-nums w-8 text-right text-text-muted text-xs">
                {revealRadius}
              </span>
            </label>
            <span className="w-px h-4 bg-border-primary mx-0.5" />
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="hover:bg-panel-secondary disabled:opacity-40 disabled:cursor-not-allowed text-text-primary px-2 py-1 rounded text-sm transition flex items-center gap-1.5"
              title="Undo"
            >
              <RotateCcw className="w-4 h-4" />
              Undo
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className="hover:bg-panel-secondary disabled:opacity-40 disabled:cursor-not-allowed text-text-primary px-2 py-1 rounded text-sm transition flex items-center gap-1.5"
              title="Redo"
            >
              <RotateCcw className="w-4 h-4 scale-x-[-1]" />
              Redo
            </button>
            <button
              onClick={onResetFog}
              disabled={!canResetFog}
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
              onClick={onOpenTokenModal}
              className="hover:bg-panel-secondary text-text-primary px-2 py-1 rounded text-sm transition flex items-center gap-1.5"
              title="Manage tokens"
            >
              <CircleUser className="w-4 h-4" />
              Tokens
              <span className="text-xs text-text-muted tabular-nums">
                {tokenCount}
              </span>
            </button>
          </div>

          {/* Section 4 — sync */}
          <div className="flex items-center gap-1 bg-panel-bg/90 border border-border-primary rounded-lg px-2 py-1">
            <span className="text-xs text-text-muted px-1 select-none">
              Local
            </span>
            <button
              onClick={onOpenPlayerView}
              className="hover:bg-panel-secondary text-text-primary px-2 py-1 rounded text-sm transition"
            >
              Open Player View
            </button>
            <span className="w-px h-4 bg-border-primary mx-1" />
            <span className="text-xs text-text-muted px-1 select-none">
              Online
            </span>
            <button
              onClick={onOpenPeerModal}
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
  );
}
