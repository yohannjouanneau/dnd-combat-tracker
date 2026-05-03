import { Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { RoomPolygon } from "../types";

interface Props {
  rooms: RoomPolygon[];
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  onHighlightRoom: (id: string | null) => void;
}

export default function RoomPanel({
  rooms,
  onRename,
  onDelete,
  onClose,
  onHighlightRoom,
}: Props) {
  const { t } = useTranslation("map");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  function startEdit(room: RoomPolygon) {
    setEditingId(room.id);
    setEditValue(room.name ?? "");
  }

  function commitEdit(id: string) {
    onRename(id, editValue.trim());
    setEditingId(null);
  }

  return (
    <div className="absolute bottom-4 left-3 z-10 w-64 bg-panel-bg/95 border border-border-primary rounded-lg shadow-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border-primary">
        <span className="text-sm font-semibold text-text-primary">
          {t("rooms.panel")}
        </span>
        <button
          onClick={onClose}
          className="text-text-muted hover:text-text-primary transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {rooms.length === 0 ? (
        <p className="text-text-muted text-xs px-3 py-3">{t("rooms.empty")}</p>
      ) : (
        <ul className="divide-y divide-border-primary max-h-60 overflow-y-auto">
          {rooms.map((room) => (
            <li
              key={room.id}
              className="flex items-center gap-2 px-3 py-2"
              onMouseEnter={() => onHighlightRoom(room.id)}
              onMouseLeave={() => onHighlightRoom(null)}
            >
              {editingId === room.id ? (
                <input
                  autoFocus
                  className="flex-1 text-sm bg-panel-secondary text-text-primary px-2 py-0.5 rounded border border-border-primary outline-none"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => commitEdit(room.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitEdit(room.id);
                    else if (e.key === "Escape") setEditingId(null);
                  }}
                />
              ) : (
                <span
                  className="flex-1 text-sm text-text-primary truncate cursor-pointer hover:text-blue-400 transition"
                  onClick={() => startEdit(room)}
                  title={t("rooms.clickToRename")}
                >
                  {room.name || t("rooms.unnamed")}
                </span>
              )}
              <button
                onClick={() => startEdit(room)}
                className="text-text-muted hover:text-text-primary transition shrink-0"
                title={t("rooms.rename")}
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDelete(room.id)}
                className="text-text-muted hover:text-red-400 transition shrink-0"
                title={t("rooms.delete")}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
