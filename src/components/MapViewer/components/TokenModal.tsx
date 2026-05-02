import { Copy, Eye, EyeOff, Plus, Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Token } from "../types";
import IconButton from "../../common/IconButton";

function resizeImage(file: File, maxSize: number): Promise<string> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.src = objectUrl;
  });
}

function tokenLabel(
  token: Token,
  playerToken: string,
  defaultToken: string,
): string {
  return token.label || (token.id === "player" ? playerToken : defaultToken);
}

interface Props {
  tokens: Token[];
  selectedTokenId: string | null;
  onSelectToken: (id: string | null) => void;
  onClose: () => void;
  onAddToken: () => void;
  onDuplicateToken: (id: string) => void;
  onRemoveToken: (id: string) => void;
  onUpdateToken: (id: string, patch: Partial<Token>) => void;
}

export default function TokenModal({
  tokens,
  selectedTokenId,
  onSelectToken,
  onClose,
  onAddToken,
  onDuplicateToken,
  onRemoveToken,
  onUpdateToken,
}: Props) {
  const { t } = useTranslation("map");
  const selectedToken = tokens.find((t) => t.id === selectedTokenId);

  return (
    <div className="absolute inset-0 z-30 bg-black/50 backdrop-blur-sm flex items-start justify-start p-4 pointer-events-none">
      <div className="mt-14 bg-panel-bg border border-border-primary rounded-xl p-4 w-72 flex flex-col gap-3 relative pointer-events-auto shadow-xl max-h-[80vh] overflow-y-auto">
        <IconButton
          variant="ghost"
          onClick={onClose}
          className="absolute top-3 right-3"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </IconButton>
        <h2 className="text-sm font-bold text-text-primary pr-6">
          {t("token.modalTitle")}
        </h2>

        {/* Token list */}
        <div className="flex flex-col gap-1">
          {tokens.map((token) => (
            <div
              key={token.id}
              onClick={() =>
                onSelectToken(selectedTokenId === token.id ? null : token.id)
              }
              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition ${
                selectedTokenId === token.id
                  ? "bg-panel-secondary"
                  : "hover:bg-panel-secondary/50"
              }`}
            >
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
                {tokenLabel(token, t("token.playerToken"), t("token.token"))}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateToken(token.id, { hidden: !token.hidden });
                }}
                className={`p-1 rounded transition ${
                  token.hidden
                    ? "text-text-muted hover:text-amber-400"
                    : "text-green-400 hover:text-text-muted"
                }`}
                title={
                  token.hidden
                    ? t("token.hiddenTitle")
                    : t("token.visibleTitle")
                }
              >
                {token.hidden ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicateToken(token.id);
                }}
                className="p-1 rounded text-text-muted hover:text-blue-400 transition"
                title={t("token.duplicateTitle")}
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              {token.id !== "player" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveToken(token.id);
                  }}
                  className="p-1 rounded text-text-muted hover:text-red-400 transition"
                  title={t("token.deleteTitle")}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={onAddToken}
          className="flex items-center justify-center gap-1.5 bg-panel-secondary hover:bg-panel-secondary/70 text-text-primary px-3 py-1.5 rounded-lg text-xs transition"
        >
          <Plus className="w-3.5 h-3.5" />
          {t("token.addToken")}
        </button>

        {selectedToken && (
          <>
            <div className="h-px bg-border-primary" />
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">
              {t("token.edit", {
                name: tokenLabel(
                  selectedToken,
                  t("token.playerToken"),
                  t("token.token"),
                ),
              })}
            </p>

            {/* Label */}
            <div className="flex flex-col gap-1">
              <span className="text-xs text-text-muted">
                {t("token.label")}
              </span>
              <input
                type="text"
                value={selectedToken.label ?? ""}
                onChange={(e) =>
                  onUpdateToken(selectedToken.id, {
                    label: e.target.value || undefined,
                  })
                }
                placeholder={t("token.labelPlaceholder")}
                className="bg-panel-secondary text-text-primary px-2 py-1 rounded text-xs border border-border-primary focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Color */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-text-muted">
                {t("token.color")}
              </span>
              <input
                type="color"
                value={selectedToken.color}
                onChange={(e) =>
                  onUpdateToken(selectedToken.id, { color: e.target.value })
                }
                className="w-10 h-8 rounded cursor-pointer border border-border-primary bg-transparent"
              />
            </div>

            {/* Image */}
            <div className="flex flex-col gap-2">
              <span className="text-xs text-text-muted">
                {t("token.image")}
              </span>
              <div className="flex items-center gap-2">
                <label className="flex-1 bg-panel-secondary hover:bg-panel-secondary/70 text-text-primary px-3 py-1.5 rounded text-xs cursor-pointer transition text-center">
                  {t("token.upload")}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      resizeImage(file, 256).then((dataUrl) =>
                        onUpdateToken(selectedToken.id, {
                          imageDataUrl: dataUrl,
                        }),
                      );
                      e.target.value = "";
                    }}
                  />
                </label>
                {selectedToken.imageDataUrl && (
                  <button
                    onClick={() =>
                      onUpdateToken(selectedToken.id, {
                        imageDataUrl: undefined,
                      })
                    }
                    className="bg-panel-secondary hover:bg-panel-secondary/80 text-text-primary px-3 py-1.5 rounded text-xs transition"
                  >
                    {t("token.clear")}
                  </button>
                )}
              </div>
              {selectedToken.imageDataUrl && (
                <img
                  src={selectedToken.imageDataUrl}
                  className="w-16 h-16 rounded-full object-cover border-2 border-border-primary mx-auto"
                  alt={t("token.imagePreviewAlt")}
                />
              )}
            </div>

            {/* Portrait */}
            <div className="flex flex-col gap-2">
              <span className="text-xs text-text-muted">
                {t("token.portrait")}
              </span>
              <div className="flex items-center gap-2">
                <label className="flex-1 bg-panel-secondary hover:bg-panel-secondary/70 text-text-primary px-3 py-1.5 rounded text-xs cursor-pointer transition text-center">
                  {t("token.upload")}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      resizeImage(file, 800).then((dataUrl) =>
                        onUpdateToken(selectedToken.id, {
                          portraitDataUrl: dataUrl,
                        }),
                      );
                      e.target.value = "";
                    }}
                  />
                </label>
                {selectedToken.portraitDataUrl && (
                  <button
                    onClick={() =>
                      onUpdateToken(selectedToken.id, {
                        portraitDataUrl: undefined,
                      })
                    }
                    className="bg-panel-secondary hover:bg-panel-secondary/80 text-text-primary px-3 py-1.5 rounded text-xs transition"
                  >
                    {t("token.clear")}
                  </button>
                )}
              </div>
              {selectedToken.portraitDataUrl && (
                <img
                  src={selectedToken.portraitDataUrl}
                  className="rounded-lg max-h-40 object-contain border border-border-primary mx-auto"
                  alt={t("token.portrait")}
                />
              )}
            </div>

            {/* Size */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">
                  {t("token.size")}
                </span>
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
                  onUpdateToken(selectedToken.id, {
                    radius: Number(e.target.value),
                  })
                }
                className="w-full accent-blue-400"
              />
            </div>

            {/* Reveals fog */}
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <span className="text-xs text-text-muted">
                {t("token.revealsFog")}
              </span>
              <input
                type="checkbox"
                checked={selectedToken.revealsFog}
                onChange={(e) =>
                  onUpdateToken(selectedToken.id, {
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
  );
}
