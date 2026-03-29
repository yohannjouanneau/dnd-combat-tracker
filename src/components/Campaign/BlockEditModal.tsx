import { X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { SavedCombat, SavedMonster, SavedPlayer } from "../../types";
import type { BuildingBlock, BuildingBlockInput, BuildingBlockType, SpecialFeature, StatCheck } from "../../types/campaign";
import { generateId } from "../../utils/utils";
import MarkdownEditor from "../common/mardown/MarkdownEditor";
import StatCheckSection from "./StatCheckSection";
import SearchSelect from "../common/SearchSelect";

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

const BLOCK_TYPES: BuildingBlockType[] = ["environment", "room", "character", "combat", "object"];

function getDefaultSpecialFeature(type: BuildingBlockType): SpecialFeature | undefined {
  if (type === "combat") return { type: "combat", combatId: null };
  if (type === "object") return { type: "loot", items: [] };
  if (type === "character") return { type: "character", linkedNpcIds: [] };
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

          {/* Child Blocks */}
          <div className="flex flex-col gap-2">
            <label className="text-sm text-text-secondary">{t("campaigns:block.children")}</label>
            {formData.children.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.children.map((childId) => {
                  const child = allBlocks.find(b => b.id === childId);
                  return (
                    <span key={childId} className="flex items-center gap-1 bg-input-bg border border-border-secondary rounded px-2 py-1 text-sm text-text-primary">
                      {child?.name || childId}
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, children: prev.children.filter(id => id !== childId) }))}
                        className="text-text-muted hover:text-text-primary transition ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
            <SearchSelect
              items={allBlocks
                .filter(b => b.id !== formData.id && !formData.children.includes(b.id))
                .map(b => ({ id: b.id, label: b.name || "Unnamed" }))}
              placeholder={t("campaigns:block.addChild")}
              onChange={(id) => {
                if (id) setFormData(prev => ({ ...prev, children: [...prev.children, id] }));
              }}
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
              <SearchSelect
                items={savedCombats.map(c => ({ id: c.id, label: c.name, icon: "⚔️" }))}
                value={formData.specialFeature?.type === "combat" ? (formData.specialFeature.combatId ?? undefined) : undefined}
                placeholder={t("campaigns:block.combatFeature.searchPlaceholder")}
                onChange={(id) => setFormData(prev => ({ ...prev, specialFeature: { type: "combat", combatId: id ?? null } }))}
                onOpenSelected={onOpenCombat}
                openSelectedTitle={t("campaigns:block.combatFeature.openCombat")}
              />
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

          {/* Special Feature — Character: multiple player/monster links */}
          {formData.type === "character" && (() => {
            const linkedIds: string[] = formData.specialFeature?.type === "character"
              ? formData.specialFeature.linkedNpcIds
              : [];
            const allNpcs = [
              ...savedPlayers.map(p => ({ id: p.id, label: p.name, group: "Players" })),
              ...savedMonsters.map(m => ({ id: m.id, label: m.name, group: "Monsters" })),
            ];
            const setIds = (ids: string[]) =>
              setFormData(prev => ({ ...prev, specialFeature: { type: "character", linkedNpcIds: ids } }));

            return (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-text-secondary">
                  {t("campaigns:block.characterFeature.linkedNpcs")}
                </label>
                {linkedIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {linkedIds.map(id => {
                      const npc = savedPlayers.find(p => p.id === id) ?? savedMonsters.find(m => m.id === id);
                      if (!npc) return null;
                      return (
                        <span key={id} className="flex items-center gap-1 bg-purple-900/30 text-purple-400 border border-purple-800/50 rounded px-2 py-0.5 text-sm">
                          <button type="button" onClick={() => onOpenNpc?.(id)} className="hover:underline">{npc.name}</button>
                          <button type="button" onClick={() => setIds(linkedIds.filter(i => i !== id))} className="hover:text-red-400 transition ml-0.5">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
                <SearchSelect
                  items={allNpcs.filter(n => !linkedIds.includes(n.id))}
                  value={undefined}
                  placeholder={t("campaigns:block.characterFeature.searchPlaceholder")}
                  onChange={(id) => { if (id) setIds([...linkedIds, id]); }}
                />
              </div>
            );
          })()}
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
