import {
  ArrowLeft,
  CircleUser,
  Crosshair,
  LocateFixed,
  MapPin,
  RotateCcw,
  Trash2,
  Upload,
  Wifi,
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface Props {
  view: "dm" | "player";
  cameraScale: number;
  isPointerMode: boolean;
  onTogglePointerMode: () => void;
  isFocusMode: boolean;
  onToggleFocusMode: () => void;
  onRecenterOnPlayer: () => void;
  onBack: () => void;
  revealRadius: number;
  onRevealRadiusChange: (r: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  canResetFog: boolean;
  onResetFog: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  tokenCount: number;
  onOpenTokenModal: () => void;
  onOpenPeerModal: () => void;
  isPeerConnected: boolean;
  isReconnecting: boolean;
}

export default function MapToolbar({
  view,
  cameraScale,
  isPointerMode,
  onTogglePointerMode,
  isFocusMode,
  onToggleFocusMode,
  onRecenterOnPlayer,
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
  onOpenPeerModal,
  isPeerConnected,
  isReconnecting,
}: Props) {
  const { t } = useTranslation("map");

  return (
    <div className="absolute top-3 left-3 z-10 flex items-center gap-1 flex-wrap">
      {/* Section 1 — navigation & status */}
      <div className="flex items-center gap-1 bg-panel-bg/90 border border-border-primary rounded-lg px-2 py-1">
        <button
          onClick={onBack}
          className="hover:text-text-primary text-text-muted px-2 py-0.5 rounded text-sm transition flex items-center gap-1.5"
          title={t("toolbar.back")}
        >
          <ArrowLeft className="w-4 h-4" />
          {t("toolbar.back")}
        </button>
        <span className="w-px h-4 bg-border-primary mx-1" />
        <span
          className={`px-2 py-0.5 rounded text-xs font-bold tracking-wide ${
            view === "dm" ? "bg-red-600 text-white" : "bg-blue-600 text-white"
          }`}
        >
          {view === "dm" ? t("toolbar.dmView") : t("toolbar.playerView")}
        </span>
        {view === "player" && (isReconnecting || isPeerConnected) && (
          <span
            className={`w-2 h-2 rounded-full ${isReconnecting ? "bg-orange-400 animate-pulse" : "bg-green-400"}`}
            title={
              isReconnecting
                ? t("overlay.reconnecting")
                : t("toolbar.connectedToDm")
            }
          />
        )}
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
          title={t("toolbar.pointerTool")}
        >
          <MapPin className="w-4 h-4" />
        </button>
        {view === "player" && (
          <button
            onClick={onRecenterOnPlayer}
            className="px-2 py-0.5 rounded text-sm transition flex items-center gap-1.5 text-text-muted hover:text-text-primary"
            title={t("toolbar.recenterOnPlayer")}
          >
            <LocateFixed className="w-4 h-4" />
          </button>
        )}
        <span className="w-px h-4 bg-border-primary mx-1" />
        {view === "dm" && (
          <button
            onClick={onToggleFocusMode}
            className={`px-2 py-0.5 rounded text-sm transition flex items-center gap-1.5 ${
              isFocusMode
                ? "bg-amber-500 text-white"
                : "text-text-muted hover:text-text-primary"
            }`}
            title={t("toolbar.focusTool")}
          >
            <Crosshair className="w-4 h-4" />
          </button>
        )}
      </div>

      {view === "dm" && (
        <>
          {/* Section 2 — fog controls */}
          <div className="flex items-center gap-1 bg-panel-bg/90 border border-border-primary rounded-lg px-2 py-1">
            <label className="hover:bg-panel-secondary text-text-primary px-2 py-1 rounded text-sm cursor-pointer transition flex items-center gap-1.5">
              <Upload className="w-4 h-4" />
              {t("toolbar.importMap")}
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
                {t("toolbar.visibility")}
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
              title={t("toolbar.undo")}
            >
              <RotateCcw className="w-4 h-4" />
              {t("toolbar.undo")}
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className="hover:bg-panel-secondary disabled:opacity-40 disabled:cursor-not-allowed text-text-primary px-2 py-1 rounded text-sm transition flex items-center gap-1.5"
              title={t("toolbar.redo")}
            >
              <RotateCcw className="w-4 h-4 scale-x-[-1]" />
              {t("toolbar.redo")}
            </button>
            <button
              onClick={onResetFog}
              disabled={!canResetFog}
              className="hover:bg-panel-secondary disabled:opacity-40 disabled:cursor-not-allowed text-text-primary px-2 py-1 rounded text-sm transition flex items-center gap-1.5"
              title={t("toolbar.resetFogTitle")}
            >
              <Trash2 className="w-4 h-4" />
              {t("toolbar.resetFog")}
            </button>
          </div>

          {/* Section 3 — tokens */}
          <div className="flex items-center gap-1 bg-panel-bg/90 border border-border-primary rounded-lg px-2 py-1">
            <button
              onClick={onOpenTokenModal}
              className="hover:bg-panel-secondary text-text-primary px-2 py-1 rounded text-sm transition flex items-center gap-1.5"
              title={t("toolbar.manageTokens")}
            >
              <CircleUser className="w-4 h-4" />
              {t("toolbar.tokens")}
              <span className="text-xs text-text-muted tabular-nums">
                {tokenCount}
              </span>
            </button>
          </div>

          {/* Section 4 — connect */}
          <div className="flex items-center gap-1 bg-panel-bg/90 border border-border-primary rounded-lg px-2 py-1">
            <button
              onClick={onOpenPeerModal}
              className="hover:bg-panel-secondary text-text-primary px-2 py-1 rounded text-sm transition flex items-center gap-1.5"
              title={t("toolbar.connectTitle")}
            >
              <Wifi className="w-4 h-4" />
              {t("toolbar.connect")}
            </button>
            {(isPeerConnected || isReconnecting) && (
              <span className="flex items-center gap-1.5 px-2 py-1 text-xs text-text-muted">
                {isReconnecting ? (
                  <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                )}
                {!isReconnecting && t("toolbar.playerConnected")}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
