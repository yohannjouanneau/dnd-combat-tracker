import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";

type Props = {
  value?: string;
  defaultIcon: string;
  onChange: (icon: string) => void;
  onClear: () => void;
};

export default function IconPicker({ value, defaultIcon, onChange, onClear }: Props) {
  const { t, i18n } = useTranslation("campaigns");
  const [open, setOpen] = useState(false);

  return (
    <div className="relative flex items-center gap-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-3xl w-12 h-12 flex items-center justify-center bg-panel-secondary hover:bg-panel-secondary/80 rounded border border-border-secondary transition"
        title={t("campaigns:block.icon")}
      >
        {value ?? defaultIcon}
      </button>

      {value && (
        <button
          type="button"
          onClick={onClear}
          className="flex items-center gap-1 text-xs text-text-muted hover:text-text-primary transition"
        >
          <X className="w-3 h-3" />
          {t("campaigns:block.iconReset")}
        </button>
      )}

      {open && (
        <>
          {/* Backdrop — captures clicks/taps outside the picker */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-14 left-0 z-50 shadow-xl rounded-xl overflow-hidden">
            <Picker
              data={data}
              locale={i18n.language.startsWith("fr") ? "fr" : "en"}
              onEmojiSelect={(emoji: { native: string }) => {
                onChange(emoji.native);
                setOpen(false);
              }}
              theme="dark"
              previewPosition="none"
              skinTonePosition="none"
            />
          </div>
        </>
      )}
    </div>
  );
}
