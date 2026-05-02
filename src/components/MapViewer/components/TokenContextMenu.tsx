import { Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import type { Token } from "../types";

interface Props {
  token: Token;
  x: number;
  y: number;
  onClose: () => void;
  onToggleVisibility: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const MENU_WIDTH = 160;
const MENU_HEIGHT = 112;

export default function TokenContextMenu({
  token,
  x,
  y,
  onClose,
  onToggleVisibility,
  onEdit,
  onDelete,
}: Props) {
  const { t } = useTranslation("map");
  const menuRef = useRef<HTMLDivElement>(null);

  // Clamp so menu never goes off-screen
  const left = Math.min(x, window.innerWidth - MENU_WIDTH - 8);
  const top = Math.min(y, window.innerHeight - MENU_HEIGHT - 8);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleMouseDown);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-50 bg-panel-bg border border-border-primary rounded-lg shadow-xl py-1 min-w-[160px]"
      style={{ left, top }}
    >
      <button
        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-text-primary hover:bg-panel-secondary transition-colors"
        onClick={onToggleVisibility}
      >
        {token.hidden ? (
          <Eye className="w-4 h-4 shrink-0" />
        ) : (
          <EyeOff className="w-4 h-4 shrink-0" />
        )}
        {token.hidden ? t("contextMenu.show") : t("contextMenu.hide")}
      </button>
      <button
        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-text-primary hover:bg-panel-secondary transition-colors"
        onClick={onEdit}
      >
        <Pencil className="w-4 h-4 shrink-0" />
        {t("contextMenu.edit")}
      </button>
      <button
        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-panel-secondary transition-colors"
        onClick={onDelete}
      >
        <Trash2 className="w-4 h-4 shrink-0" />
        {t("contextMenu.delete")}
      </button>
    </div>,
    document.body,
  );
}
