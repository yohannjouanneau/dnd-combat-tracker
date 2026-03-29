import { Plus, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { SavedCombat, SavedMonster, SavedPlayer } from "../../types";
import type { BlockFeatureData, BlockFeatureKey, BlockTypeDef, BuildingBlock, BuildingBlockInput, StatCheck } from "../../types/campaign";
import { generateId } from "../../utils/utils";
import MarkdownEditor from "../common/mardown/MarkdownEditor";
import StatCheckSection from "./StatCheckSection";
import SearchSelect from "../common/SearchSelect";
import IconPicker from "../common/IconPicker";

interface Props {
  block?: BuildingBlock;
  allBlocks: BuildingBlock[];
  blockTypes: BlockTypeDef[];
  savedCombats: SavedCombat[];
  savedPlayers: SavedPlayer[];
  savedMonsters: SavedMonster[];
  isCreating: boolean;
  onSave: (data: BuildingBlockInput) => void;
  onCancel: () => void;
  onCreateBlockType: (input: Omit<BlockTypeDef, "isBuiltIn">) => Promise<BlockTypeDef>;
  onDeleteBlockType?: (id: string) => Promise<void>;
  onOpenNpc?: (npcId: string) => void;
  onOpenCombat?: (combatId: string) => void;
}

function getTypeDisplayName(type: BlockTypeDef, t: (key: string) => string): string {
  return type.isBuiltIn ? t(`campaigns:block.types.${type.id}`) : type.name;
}

export default function BlockEditModal({
  block, allBlocks, blockTypes, savedCombats, savedPlayers, savedMonsters,
  isCreating, onSave, onCancel, onCreateBlockType, onDeleteBlockType, onOpenNpc, onOpenCombat,
}: Props) {
  const { t } = useTranslation(["campaigns", "common"]);

  const defaultTypeId = "scene";

  const [formData, setFormData] = useState<BuildingBlockInput>(() => {
    if (block) {
      const { createdAt: _c, updatedAt: _u, ...rest } = block; // eslint-disable-line @typescript-eslint/no-unused-vars
      return rest;
    }
    return {
      id: generateId(),
      typeId: defaultTypeId,
      name: "",
      description: "",
      children: [],
      statChecks: [],
      tags: [],
      featureData: undefined,
    };
  });

  const [tagsInput, setTagsInput] = useState<string>((block?.tags ?? []).join(", "));

  // "Create new type" dialog state
  const [showCreateType, setShowCreateType] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeIcon, setNewTypeIcon] = useState("🎲");
  const [newTypeFeatures, setNewTypeFeatures] = useState<BlockFeatureKey[]>([]);

  const currentTypeDef = blockTypes.find((t) => t.id === formData.typeId);
  const hasCharacters = currentTypeDef?.features.includes("characters") ?? false;
  const hasCombat = currentTypeDef?.features.includes("combat") ?? false;
  const hasLoot = currentTypeDef?.features.includes("loot") ?? false;

  const handleTypeChange = (typeId: string) => {
    const typeDef = blockTypes.find((t) => t.id === typeId);
    // Reset featureData when switching to a type with no features
    const newFeatureData: BlockFeatureData | undefined = typeDef?.features.length
      ? {
          linkedNpcIds: typeDef.features.includes("characters") ? (formData.featureData?.linkedNpcIds ?? []) : undefined,
          combatId: typeDef.features.includes("combat") ? (formData.featureData?.combatId ?? null) : undefined,
          items: typeDef.features.includes("loot") ? (formData.featureData?.items ?? []) : undefined,
        }
      : undefined;
    setFormData((prev) => ({ ...prev, typeId, featureData: newFeatureData }));
  };

  const openCreateTypeDialog = () => {
    // Auto-detect features from current form data
    const detected: BlockFeatureKey[] = [];
    if ((formData.featureData?.linkedNpcIds?.length ?? 0) > 0) detected.push("characters");
    if (formData.featureData?.combatId != null) detected.push("combat");
    if ((formData.featureData?.items?.length ?? 0) > 0) detected.push("loot");
    setNewTypeName("");
    setNewTypeIcon("🎲");
    setNewTypeFeatures(detected);
    setShowCreateType(true);
  };

  const handleCreateType = async () => {
    if (!newTypeName.trim()) return;
    const created = await onCreateBlockType({
      id: generateId(),
      name: newTypeName.trim(),
      icon: newTypeIcon,
      features: newTypeFeatures,
    });
    // Switch the block to the new type, preserving relevant feature data
    const newFeatureData: BlockFeatureData | undefined = newTypeFeatures.length
      ? {
          linkedNpcIds: newTypeFeatures.includes("characters") ? (formData.featureData?.linkedNpcIds ?? []) : undefined,
          combatId: newTypeFeatures.includes("combat") ? (formData.featureData?.combatId ?? null) : undefined,
          items: newTypeFeatures.includes("loot") ? (formData.featureData?.items ?? []) : undefined,
        }
      : undefined;
    setFormData((prev) => ({ ...prev, typeId: created.id, featureData: newFeatureData }));
    setShowCreateType(false);
  };

  const toggleNewTypeFeature = (key: BlockFeatureKey) => {
    setNewTypeFeatures((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]
    );
  };

  const handleTagsChange = (value: string) => {
    setTagsInput(value);
    const tags = value.split(",").map((s) => s.trim()).filter(Boolean);
    setFormData((prev) => ({ ...prev, tags }));
  };

  const handleSave = () => {
    if (!formData.name.trim()) return;
    onSave(formData);
  };

  const handleStatChecksChange = (statChecks: StatCheck[]) => {
    setFormData((prev) => ({ ...prev, statChecks }));
  };

  const patchFeatureData = (patch: Partial<BlockFeatureData>) => {
    setFormData((prev) => ({ ...prev, featureData: { ...prev.featureData, ...patch } }));
  };

  const linkedNpcIds = formData.featureData?.linkedNpcIds ?? [];
  const setLinkedNpcIds = (ids: string[]) => patchFeatureData({ linkedNpcIds: ids });

  const allNpcs = [
    ...savedPlayers.map((p) => ({ id: p.id, label: p.name, group: "Players" })),
    ...savedMonsters.map((m) => ({ id: m.id, label: m.name, group: "Monsters" })),
  ];

  const defaultIcon = currentTypeDef?.icon ?? "📦";

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
          {/* Icon picker */}
          <div className="flex flex-col gap-2 items-center">
            <label className="text-sm text-text-secondary">{t("campaigns:block.icon")}</label>
            <IconPicker
              value={formData.icon}
              defaultIcon={defaultIcon}
              onChange={(icon) => setFormData((prev) => ({ ...prev, icon }))}
              onClear={() => setFormData((prev) => ({ ...prev, icon: undefined }))}
            />
          </div>

          {/* Name */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-text-secondary">{t("campaigns:block.name")}</label>
            <input
              type="text"
              value={formData.name}
              placeholder={t("campaigns:block.namePlaceholder")}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              className="bg-input-bg text-text-primary rounded px-3 py-2 border border-border-secondary focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Type selector */}
          <div className="flex flex-col gap-2">
            <label className="text-sm text-text-secondary">{t("campaigns:block.type")}</label>
            <div className="flex flex-wrap gap-1.5">
              {blockTypes.filter((type) => type.id !== "scene").map((type) => (
                <div key={type.id} className="relative group/type">
                  <button
                    type="button"
                    onClick={() => handleTypeChange(type.id)}
                    className={[
                      "flex items-center gap-1.5 px-2.5 py-1.5 rounded text-sm transition border",
                      formData.typeId === type.id
                        ? "bg-blue-600/20 border-blue-500 text-text-primary"
                        : "bg-panel-secondary border-border-secondary text-text-muted hover:text-text-primary hover:border-border-primary",
                    ].join(" ")}
                  >
                    <span>{type.icon}</span>
                    <span>{getTypeDisplayName(type, t)}</span>
                  </button>
                  {!type.isBuiltIn && onDeleteBlockType && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onDeleteBlockType(type.id); }}
                      className="absolute -top-1 -right-1 hidden group-hover/type:flex w-4 h-4 bg-red-600 hover:bg-red-700 text-white rounded-full items-center justify-center text-[10px] leading-none transition z-10"
                      title="Delete type"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              {/* New type button */}
              <button
                type="button"
                onClick={openCreateTypeDialog}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded text-sm border border-dashed border-border-secondary text-text-muted hover:text-text-primary hover:border-border-primary transition"
              >
                <Plus className="w-3.5 h-3.5" />
                {t("campaigns:block.blockType.new")}
              </button>
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
                  const child = allBlocks.find((b) => b.id === childId);
                  return (
                    <span key={childId} className="flex items-center gap-1 bg-input-bg border border-border-secondary rounded px-2 py-1 text-sm text-text-primary">
                      {child?.name || childId}
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, children: prev.children.filter((id) => id !== childId) }))}
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
                .filter((b) => b.id !== formData.id && !formData.children.includes(b.id))
                .map((b) => ({ id: b.id, label: b.name || "Unnamed" }))}
              placeholder={t("campaigns:block.addChild")}
              onChange={(id) => {
                if (id) setFormData((prev) => ({ ...prev, children: [...prev.children, id] }));
              }}
            />
          </div>

          {/* Stat Checks */}
          <StatCheckSection
            statChecks={formData.statChecks}
            allBlocks={allBlocks}
            onChange={handleStatChecksChange}
          />

          {/* Feature — Characters */}
          {hasCharacters && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-secondary">
                {t("campaigns:block.characterFeature.linkedNpcs")}
              </label>
              {linkedNpcIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {linkedNpcIds.map((id) => {
                    const npc = savedPlayers.find((p) => p.id === id) ?? savedMonsters.find((m) => m.id === id);
                    if (!npc) return null;
                    return (
                      <span key={id} className="flex items-center gap-1 bg-purple-900/30 text-purple-400 border border-purple-800/50 rounded px-2 py-0.5 text-sm">
                        <button type="button" onClick={() => onOpenNpc?.(id)} className="hover:underline">{npc.name}</button>
                        <button type="button" onClick={() => setLinkedNpcIds(linkedNpcIds.filter((i) => i !== id))} className="hover:text-red-400 transition ml-0.5">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
              <SearchSelect
                items={allNpcs.filter((n) => !linkedNpcIds.includes(n.id))}
                value={undefined}
                placeholder={t("campaigns:block.characterFeature.searchPlaceholder")}
                onChange={(id) => { if (id) setLinkedNpcIds([...linkedNpcIds, id]); }}
              />
            </div>
          )}

          {/* Feature — Combat */}
          {hasCombat && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-secondary">
                {t("campaigns:block.combatFeature.linked")}
              </label>
              <SearchSelect
                items={savedCombats.map((c) => ({ id: c.id, label: c.name, icon: "⚔️" }))}
                value={formData.featureData?.combatId ?? undefined}
                placeholder={t("campaigns:block.combatFeature.searchPlaceholder")}
                onChange={(id) => patchFeatureData({ combatId: id ?? null })}
                onOpenSelected={onOpenCombat}
                openSelectedTitle={t("campaigns:block.combatFeature.openCombat")}
              />
            </div>
          )}

          {/* Feature — Loot */}
          {hasLoot && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-text-secondary">
                  {t("campaigns:block.lootFeature.items")}
                </label>
                <button
                  type="button"
                  onClick={() => patchFeatureData({ items: [...(formData.featureData?.items ?? []), ""] })}
                  className="text-xs text-blue-400 hover:text-blue-300 transition"
                >
                  + {t("campaigns:block.lootFeature.addItem")}
                </button>
              </div>
              {(formData.featureData?.items ?? []).map((item, idx) => (
                <input
                  key={idx}
                  type="text"
                  value={item}
                  placeholder={t("campaigns:block.lootFeature.itemPlaceholder")}
                  onChange={(e) => {
                    const items = [...(formData.featureData?.items ?? [])];
                    items[idx] = e.target.value;
                    patchFeatureData({ items });
                  }}
                  className="bg-input-bg text-text-primary rounded px-3 py-2 border border-border-secondary focus:border-blue-500 focus:outline-none text-sm"
                />
              ))}
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

      {/* Create Type Dialog */}
      {showCreateType && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm bg-app-bg rounded-xl border border-border-primary shadow-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-text-primary">{t("campaigns:block.blockType.new")}</h3>
              <button onClick={() => setShowCreateType(false)} className="text-text-muted hover:text-text-primary transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <IconPicker
                value={newTypeIcon === "🎲" ? undefined : newTypeIcon}
                defaultIcon="🎲"
                onChange={setNewTypeIcon}
                onClear={() => setNewTypeIcon("🎲")}
              />
              <input
                type="text"
                value={newTypeName}
                placeholder={t("campaigns:block.blockType.namePlaceholder")}
                onChange={(e) => setNewTypeName(e.target.value)}
                className="flex-1 bg-input-bg text-text-primary rounded px-3 py-2 border border-border-secondary focus:border-blue-500 focus:outline-none text-sm"
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm text-text-secondary">{t("campaigns:block.blockType.features")}</label>
              <div className="flex gap-3">
                {(["characters", "combat", "loot"] as BlockFeatureKey[]).map((key) => (
                  <label key={key} className="flex items-center gap-1.5 text-sm text-text-primary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newTypeFeatures.includes(key)}
                      onChange={() => toggleNewTypeFeature(key)}
                      className="rounded border-border-secondary"
                    />
                    {t(`campaigns:block.blockType.feature${key.charAt(0).toUpperCase() + key.slice(1)}` as `campaigns:block.blockType.feature${string}`)}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCreateType(false)}
                className="px-3 py-1.5 rounded bg-panel-secondary hover:bg-panel-secondary/80 text-text-primary text-sm transition"
              >
                {t("common:actions.cancel")}
              </button>
              <button
                onClick={handleCreateType}
                disabled={!newTypeName.trim()}
                className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm transition disabled:opacity-50"
              >
                {t("campaigns:block.blockType.create")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
