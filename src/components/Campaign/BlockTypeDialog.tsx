import { X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { BlockFeatureKey, BlockTypeDef } from "../../types/campaign";
import IconPicker from "../common/IconPicker";

interface Props {
  editingType?: BlockTypeDef;
  initialFeatures?: BlockFeatureKey[];
  onConfirm: (name: string, icon: string, features: BlockFeatureKey[]) => void;
  onCancel: () => void;
}

export default function BlockTypeDialog({
  editingType,
  initialFeatures,
  onConfirm,
  onCancel,
}: Props) {
  const { t } = useTranslation(["campaigns", "common"]);
  const [name, setName] = useState(editingType?.name ?? "");
  const [icon, setIcon] = useState(editingType?.icon ?? "🎲");
  const [features, setFeatures] = useState<BlockFeatureKey[]>(
    editingType?.features ?? initialFeatures ?? [],
  );

  const toggleFeature = (key: BlockFeatureKey) => {
    setFeatures((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key],
    );
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-sm bg-app-bg rounded-xl border border-border-primary shadow-xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-text-primary">
            {editingType
              ? t("campaigns:block.blockType.editTitle")
              : t("campaigns:block.blockType.new")}
          </h3>
          <button
            onClick={onCancel}
            className="text-text-muted hover:text-text-primary transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <IconPicker
            value={icon === "🎲" ? undefined : icon}
            defaultIcon="🎲"
            onChange={setIcon}
            onClear={() => setIcon("🎲")}
          />
          <input
            type="text"
            value={name}
            placeholder={t("campaigns:block.blockType.namePlaceholder")}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 bg-input-bg text-text-primary rounded px-3 py-2 border border-border-secondary focus:border-blue-500 focus:outline-none text-sm"
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm text-text-secondary">
            {t("campaigns:block.blockType.features")}
          </label>
          <div className="flex gap-3">
            {(
              ["characters", "combat", "loot", "countdown"] as BlockFeatureKey[]
            ).map((key) => (
              <label
                key={key}
                className="flex items-center gap-1.5 text-sm text-text-primary cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={features.includes(key)}
                  onChange={() => toggleFeature(key)}
                  className="rounded border-border-secondary"
                />
                {t(
                  `campaigns:block.blockType.feature${key.charAt(0).toUpperCase() + key.slice(1)}` as `campaigns:block.blockType.feature${string}`,
                )}
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 rounded bg-panel-secondary hover:bg-panel-secondary/80 text-text-primary text-sm transition"
          >
            {t("common:actions.cancel")}
          </button>
          <button
            onClick={() =>
              name.trim() && onConfirm(name.trim(), icon, features)
            }
            disabled={!name.trim()}
            className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm transition disabled:opacity-50"
          >
            {editingType
              ? t("campaigns:block.blockType.save")
              : t("campaigns:block.blockType.create")}
          </button>
        </div>
      </div>
    </div>
  );
}
