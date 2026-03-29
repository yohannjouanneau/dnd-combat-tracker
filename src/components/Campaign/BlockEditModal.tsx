import { ExternalLink, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { SavedCombat, SavedMonster, SavedPlayer } from "../../types";
import type { BuildingBlock, BuildingBlockInput, BuildingBlockType, SpecialFeature, StatCheck } from "../../types/campaign";
import { generateId } from "../../utils/utils";
import MarkdownEditor from "../common/mardown/MarkdownEditor";
import StatCheckSection from "./StatCheckSection";

interface Props {
  block?: BuildingBlock;
  allBlocks: BuildingBlock[];
  savedCombats: SavedCombat[];
  savedPlayers: SavedPlayer[];
  savedMonsters: SavedMonster[];
  isCreating: boolean;
  onSave: (data: BuildingBlockInput) => void;
  onCancel: () => void;
  onOpenNpc?: (npcId: string) => void;
  onOpenCombat?: (combatId: string) => void;
}

const BLOCK_TYPES: BuildingBlockType[] = ["environment", "room", "npc", "combat", "object"];

function getDefaultSpecialFeature(type: BuildingBlockType): SpecialFeature | undefined {
  if (type === "combat") return { type: "combat", combatId: null };
  if (type === "object") return { type: "loot", items: [] };
  if (type === "npc") return { type: "npc" };
  return undefined;
}

export default function BlockEditModal({ block, allBlocks, savedCombats, savedPlayers, savedMonsters, isCreating, onSave, onCancel, onOpenNpc, onOpenCombat }: Props) {
  const { t } = useTranslation(["campaigns", "common"]);

  const [formData, setFormData] = useState<BuildingBlockInput>(() => {
    if (block) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = block;
      return rest;
    }
    return {
      id: generateId(),
      type: "room",
      name: "",
      description: "",
      children: [],
      statChecks: [],
      tags: [],
      specialFeature: undefined,
    };
  });

  const [tagsInput, setTagsInput] = useState<string>(
    (block?.tags ?? []).join(", ")
  );

  const handleTypeChange = (type: BuildingBlockType) => {
    setFormData((prev) => ({
      ...prev,
      type,
      specialFeature: getDefaultSpecialFeature(type),
    }));
  };

  const handleTagsChange = (value: string) => {
    setTagsInput(value);
    const tags = value
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    setFormData((prev) => ({ ...prev, tags }));
  };

  const handleSave = () => {
    if (!formData.name.trim()) return;
    onSave(formData);
  };

  const updateSpecialFeature = (patch: Partial<SpecialFeature> & { type: SpecialFeature["type"] }) => {
    setFormData((prev) => ({
      ...prev,
      specialFeature: { ...(prev.specialFeature as SpecialFeature), ...patch } as SpecialFeature,
    }));
  };

  const handleStatChecksChange = (statChecks: StatCheck[]) => {
    setFormData((prev) => ({ ...prev, statChecks }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 overflow-y-auto py-8 px-4">
      <div className="w-full max-w-2xl bg-app-bg rounded-xl border border-border-primary shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-primary">
          <h2 className="text-lg font-semibold text-text-primary">
            {isCreating ? t("campaigns:block.new") : t("campaigns:block.edit")}
          </h2>
          <button onClick={onCancel} className="text-text-muted hover:text-text-primary transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Name + Type row */}
          <div className="flex gap-3">
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-sm text-text-secondary">{t("campaigns:block.name")}</label>
              <input
                type="text"
                value={formData.name}
                placeholder={t("campaigns:block.namePlaceholder")}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="bg-input-bg text-text-primary rounded px-3 py-2 border border-border-secondary focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-text-secondary">{t("campaigns:block.type")}</label>
              <select
                value={formData.type}
                onChange={(e) => handleTypeChange(e.target.value as BuildingBlockType)}
                className="bg-input-bg text-text-primary rounded px-3 py-2 border border-border-secondary focus:border-blue-500 focus:outline-none"
              >
                {BLOCK_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {t(`campaigns:block.types.${type}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-text-secondary">{t("campaigns:block.description")}</label>
            <MarkdownEditor
              value={formData.description}
              onChange={(value) => setFormData((prev) => ({ ...prev, description: value }))}
            />
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-text-secondary">{t("campaigns:block.tags")}</label>
            <input
              type="text"
              value={tagsInput}
              placeholder={t("campaigns:block.tagsPlaceholder")}
              onChange={(e) => handleTagsChange(e.target.value)}
              className="bg-input-bg text-text-primary rounded px-3 py-2 border border-border-secondary focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Stat Checks */}
          <StatCheckSection
            statChecks={formData.statChecks}
            allBlocks={allBlocks}
            onChange={handleStatChecksChange}
          />

          {/* Special Feature — Combat */}
          {formData.type === "combat" && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-secondary">
                {t("campaigns:block.combatFeature.linked")}
              </label>
              <div className="flex gap-2 items-center">
                <select
                  value={
                    formData.specialFeature?.type === "combat"
                      ? (formData.specialFeature.combatId ?? "")
                      : ""
                  }
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      specialFeature: { type: "combat", combatId: e.target.value || null },
                    }))
                  }
                  className="flex-1 bg-input-bg text-text-primary rounded px-3 py-2 border border-border-secondary focus:border-blue-500 focus:outline-none"
                >
                  <option value="">{t("campaigns:block.combatFeature.unlinked")}</option>
                  {savedCombats.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {formData.specialFeature?.type === "combat" && formData.specialFeature.combatId && (
                  <button
                    type="button"
                    onClick={() => onOpenCombat?.((formData.specialFeature as { type: "combat"; combatId: string }).combatId)}
                    className="p-2 rounded bg-panel-secondary hover:bg-red-100 dark:hover:bg-red-900/30 text-text-secondary hover:text-red-600 dark:hover:text-red-400 transition"
                    title={t("campaigns:block.combatFeature.openCombat")}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {formData.type === "object" && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-text-secondary">
                  {t("campaigns:block.lootFeature.items")}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const feature = formData.specialFeature?.type === "loot"
                      ? formData.specialFeature
                      : { type: "loot" as const, items: [] };
                    updateSpecialFeature({ type: "loot", items: [...feature.items, ""] });
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300 transition"
                >
                  + {t("campaigns:block.lootFeature.addItem")}
                </button>
              </div>
              {(formData.specialFeature?.type === "loot" ? formData.specialFeature.items : []).map(
                (item, idx) => (
                  <input
                    key={idx}
                    type="text"
                    value={item}
                    placeholder={t("campaigns:block.lootFeature.itemPlaceholder")}
                    onChange={(e) => {
                      if (formData.specialFeature?.type !== "loot") return;
                      const items = [...formData.specialFeature.items];
                      items[idx] = e.target.value;
                      updateSpecialFeature({ type: "loot", items });
                    }}
                    className="bg-input-bg text-text-primary rounded px-3 py-2 border border-border-secondary focus:border-blue-500 focus:outline-none text-sm"
                  />
                )
              )}
            </div>
          )}

          {/* Special Feature — NPC: player or monster picker */}
          {formData.type === "npc" && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-secondary">
                {t("campaigns:block.npcFeature.linkedNpc")}
              </label>
              <div className="flex gap-2 items-center">
                <select
                  value={
                    formData.specialFeature?.type === "npc"
                      ? (formData.specialFeature.linkedNpcId ?? "")
                      : ""
                  }
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      specialFeature: { type: "npc", linkedNpcId: e.target.value || undefined },
                    }))
                  }
                  className="flex-1 bg-input-bg text-text-primary rounded px-3 py-2 border border-border-secondary focus:border-blue-500 focus:outline-none"
                >
                  <option value="">{t("campaigns:block.npcFeature.unlinked")}</option>
                  {savedPlayers.length > 0 && (
                    <optgroup label="Players">
                      {savedPlayers.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </optgroup>
                  )}
                  {savedMonsters.length > 0 && (
                    <optgroup label="Monsters">
                      {savedMonsters.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
                {formData.specialFeature?.type === "npc" && formData.specialFeature.linkedNpcId && (
                  <button
                    type="button"
                    onClick={() => onOpenNpc?.(formData.specialFeature!.type === "npc" ? (formData.specialFeature as { type: "npc"; linkedNpcId?: string }).linkedNpcId! : "")}
                    className="p-2 rounded bg-panel-secondary hover:bg-purple-100 dark:hover:bg-purple-900/30 text-text-secondary hover:text-purple-600 dark:hover:text-purple-400 transition"
                    title={t("campaigns:block.npcFeature.openNpc")}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-border-primary">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded bg-panel-secondary hover:bg-panel-secondary/80 text-text-primary text-sm transition"
          >
            {t("common:actions.cancel")}
          </button>
          <button
            onClick={handleSave}
            disabled={!formData.name.trim()}
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("common:actions.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
