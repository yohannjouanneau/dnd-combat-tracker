import { Edit2, Plus, X } from "lucide-react";
import BlockTypeDialog from "./BlockTypeDialog";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { SavedCombat, SavedMonster, SavedPlayer } from "../../types";
import type {
  BlockFeatureData,
  BlockFeatureKey,
  BlockTypeDef,
  BuildingBlock,
  BuildingBlockInput,
  CountdownData,
  StatCheck,
} from "../../types/campaign";
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
  onCreateBlockType: (
    input: Omit<BlockTypeDef, "isBuiltIn">,
  ) => Promise<BlockTypeDef>;
  onUpdateBlockType?: (
    id: string,
    patch: Partial<BlockTypeDef>,
  ) => Promise<BlockTypeDef>;
  onDeleteBlockType?: (id: string) => Promise<void>;
  onOpenNpc?: (npcId: string) => void;
  onOpenCombat?: (combatId: string) => void;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border-primary bg-panel-bg p-4 flex flex-col gap-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
        {title}
      </h3>
      {children}
    </div>
  );
}

function getTypeDisplayName(
  type: BlockTypeDef,
  t: (key: string) => string,
): string {
  return type.isBuiltIn ? t(`campaigns:block.types.${type.id}`) : type.name;
}

export default function BlockEditModal({
  block,
  allBlocks,
  blockTypes,
  savedCombats,
  savedPlayers,
  savedMonsters,
  isCreating,
  onSave,
  onCancel,
  onCreateBlockType,
  onUpdateBlockType,
  onDeleteBlockType,
  onOpenNpc,
  onOpenCombat,
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
      countdown: undefined,
      extraFeatures: [],
    };
  });

  const [tagsInput, setTagsInput] = useState<string>(
    (block?.tags ?? []).join(", "),
  );

  const [showCreateType, setShowCreateType] = useState(false);
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [pendingInitialFeatures, setPendingInitialFeatures] = useState<
    BlockFeatureKey[]
  >([]);

  const currentTypeDef = blockTypes.find((t) => t.id === formData.typeId);
  // activeFeatures = type's features ∪ block's own extra features
  const activeFeatures = new Set<BlockFeatureKey>([
    ...(currentTypeDef?.features ?? []),
    ...(formData.extraFeatures ?? []),
  ]);
  const hasCharacters = activeFeatures.has("characters");
  const hasCombat = activeFeatures.has("combat");
  const hasLoot = activeFeatures.has("loot");
  const hasCountdown = activeFeatures.has("countdown");

  const handleTypeChange = (typeId: string) => {
    const typeDef = blockTypes.find((t) => t.id === typeId);
    const typeFeatureSet = new Set<BlockFeatureKey>(typeDef?.features ?? []);
    // Keep only extra features not already covered by the new type
    const newExtraFeatures = (formData.extraFeatures ?? []).filter(
      (f) => !typeFeatureSet.has(f),
    );
    const newActiveFeatures = new Set<BlockFeatureKey>([
      ...typeFeatureSet,
      ...newExtraFeatures,
    ]);
    const newFeatureData: BlockFeatureData | undefined = newActiveFeatures.size
      ? {
          linkedNpcIds: newActiveFeatures.has("characters")
            ? (formData.featureData?.linkedNpcIds ?? [])
            : undefined,
          combatId: newActiveFeatures.has("combat")
            ? (formData.featureData?.combatId ?? null)
            : undefined,
          items: newActiveFeatures.has("loot")
            ? (formData.featureData?.items ?? [])
            : undefined,
        }
      : undefined;
    const countdown = newActiveFeatures.has("countdown")
      ? formData.countdown
      : undefined;
    setFormData((prev) => ({
      ...prev,
      typeId,
      featureData: newFeatureData,
      countdown,
      extraFeatures: newExtraFeatures,
    }));
  };

  const openCreateTypeDialog = () => {
    const detected: BlockFeatureKey[] = [];
    if ((formData.featureData?.linkedNpcIds?.length ?? 0) > 0)
      detected.push("characters");
    if (formData.featureData?.combatId != null) detected.push("combat");
    if ((formData.featureData?.items?.length ?? 0) > 0) detected.push("loot");
    setEditingTypeId(null);
    setPendingInitialFeatures(detected);
    setShowCreateType(true);
  };

  const openEditTypeDialog = (type: BlockTypeDef) => {
    setEditingTypeId(type.id);
    setPendingInitialFeatures([]);
    setShowCreateType(true);
  };

  const handleTypeConfirm = async (
    name: string,
    icon: string,
    features: BlockFeatureKey[],
  ) => {
    if (editingTypeId && onUpdateBlockType) {
      const updated = await onUpdateBlockType(editingTypeId, {
        name,
        icon,
        features,
      });
      if (formData.typeId === updated.id) {
        const typeFeatureSet = new Set<BlockFeatureKey>(updated.features);
        const newExtraFeatures = (formData.extraFeatures ?? []).filter(
          (f) => !typeFeatureSet.has(f),
        );
        const newActiveFeatures = new Set<BlockFeatureKey>([
          ...typeFeatureSet,
          ...newExtraFeatures,
        ]);
        const newFeatureData: BlockFeatureData | undefined =
          newActiveFeatures.size
            ? {
                linkedNpcIds: newActiveFeatures.has("characters")
                  ? (formData.featureData?.linkedNpcIds ?? [])
                  : undefined,
                combatId: newActiveFeatures.has("combat")
                  ? (formData.featureData?.combatId ?? null)
                  : undefined,
                items: newActiveFeatures.has("loot")
                  ? (formData.featureData?.items ?? [])
                  : undefined,
              }
            : undefined;
        const countdown = newActiveFeatures.has("countdown")
          ? formData.countdown
          : undefined;
        setFormData((prev) => ({
          ...prev,
          featureData: newFeatureData,
          countdown,
          extraFeatures: newExtraFeatures,
        }));
      }
    } else {
      const created = await onCreateBlockType({
        id: generateId(),
        name,
        icon,
        features,
      });
      const newFeatureData: BlockFeatureData | undefined = features.length
        ? {
            linkedNpcIds: features.includes("characters")
              ? (formData.featureData?.linkedNpcIds ?? [])
              : undefined,
            combatId: features.includes("combat")
              ? (formData.featureData?.combatId ?? null)
              : undefined,
            items: features.includes("loot")
              ? (formData.featureData?.items ?? [])
              : undefined,
          }
        : undefined;
      const countdown = features.includes("countdown")
        ? formData.countdown
        : undefined;
      setFormData((prev) => ({
        ...prev,
        typeId: created.id,
        featureData: newFeatureData,
        countdown,
        extraFeatures: [],
      }));
    }
    setShowCreateType(false);
  };

  const toggleExtraFeature = (key: BlockFeatureKey) => {
    const typeFeatures = currentTypeDef?.features ?? [];
    if (typeFeatures.includes(key)) return; // can't toggle off type-defined features here
    const current = formData.extraFeatures ?? [];
    const newExtra = current.includes(key)
      ? current.filter((f) => f !== key)
      : [...current, key];
    // Update featureData to reflect the new active features
    const newActiveFeatures = new Set<BlockFeatureKey>([
      ...typeFeatures,
      ...newExtra,
    ]);
    const newFeatureData: BlockFeatureData | undefined = newActiveFeatures.size
      ? {
          linkedNpcIds: newActiveFeatures.has("characters")
            ? (formData.featureData?.linkedNpcIds ?? [])
            : undefined,
          combatId: newActiveFeatures.has("combat")
            ? (formData.featureData?.combatId ?? null)
            : undefined,
          items: newActiveFeatures.has("loot")
            ? (formData.featureData?.items ?? [])
            : undefined,
        }
      : undefined;
    const countdown = newActiveFeatures.has("countdown")
      ? formData.countdown
      : undefined;
    setFormData((prev) => ({
      ...prev,
      featureData: newFeatureData,
      countdown,
      extraFeatures: newExtra,
    }));
  };

  const handleTagsChange = (value: string) => {
    setTagsInput(value);
    const tags = value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
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
    setFormData((prev) => ({
      ...prev,
      featureData: { ...prev.featureData, ...patch },
    }));
  };

  const linkedNpcIds = formData.featureData?.linkedNpcIds ?? [];
  const setLinkedNpcIds = (ids: string[]) =>
    patchFeatureData({ linkedNpcIds: ids });

  const allNpcs = [
    ...savedPlayers.map((p) => ({ id: p.id, label: p.name, group: "Players" })),
    ...savedMonsters.map((m) => ({
      id: m.id,
      label: m.name,
      group: "Monsters",
    })),
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
          <button
            onClick={onCancel}
            className="text-text-muted hover:text-text-primary transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          {/* ── Identity ── */}
          <Section title={t("campaigns:block.sections.identity")}>
            {/* Icon + Name side-by-side */}
            <div className="flex items-center gap-3">
              <IconPicker
                value={formData.icon}
                defaultIcon={defaultIcon}
                onChange={(icon) => setFormData((prev) => ({ ...prev, icon }))}
                onClear={() =>
                  setFormData((prev) => ({ ...prev, icon: undefined }))
                }
              />
              <input
                type="text"
                value={formData.name}
                placeholder={t("campaigns:block.namePlaceholder")}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="flex-1 bg-input-bg text-text-primary rounded px-3 py-2 border border-border-secondary focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Type pills */}
            <div className="flex flex-wrap gap-1.5">
              {blockTypes
                .filter((type) => type.id !== "scene")
                .map((type) => (
                  <div key={type.id} className="relative group/type">
                    <button
                      type="button"
                      onClick={() => handleTypeChange(type.id)}
                      className={[
                        "flex items-center gap-1.5 px-2.5 py-1.5 rounded text-sm transition border",
                        formData.typeId === type.id
                          ? "bg-accent/20 border-accent text-text-primary"
                          : "bg-panel-secondary border-border-secondary text-text-muted hover:text-text-primary hover:border-border-primary",
                      ].join(" ")}
                    >
                      <span>{type.icon}</span>
                      <span>{getTypeDisplayName(type, t)}</span>
                    </button>
                    {!type.isBuiltIn && (
                      <>
                        {onUpdateBlockType && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditTypeDialog(type);
                            }}
                            className="absolute -top-1 -left-1 hidden group-hover/type:flex w-4 h-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full items-center justify-center transition z-10"
                            title={t("campaigns:block.blockType.edit")}
                          >
                            <Edit2 className="w-2.5 h-2.5" />
                          </button>
                        )}
                        {onDeleteBlockType && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteBlockType(type.id);
                            }}
                            className="absolute -top-1 -right-1 hidden group-hover/type:flex w-4 h-4 bg-red-600 hover:bg-red-700 text-white rounded-full items-center justify-center text-[10px] leading-none transition z-10"
                            title="Delete type"
                          >
                            ×
                          </button>
                        )}
                      </>
                    )}
                  </div>
                ))}
              <button
                type="button"
                onClick={openCreateTypeDialog}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded text-sm border border-dashed border-border-secondary text-text-muted hover:text-text-primary hover:border-border-primary transition"
              >
                <Plus className="w-3.5 h-3.5" />
                {t("campaigns:block.blockType.new")}
              </button>
            </div>

            {/* Additional feature toggles (for features beyond the type's defaults) */}
            {formData.typeId !== defaultTypeId && (
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border-secondary">
                <span className="text-xs text-text-muted">
                  {t("campaigns:block.sections.features")}:
                </span>
                {(
                  [
                    "characters",
                    "combat",
                    "loot",
                    "countdown",
                  ] as BlockFeatureKey[]
                ).map((key) => {
                  const isFromType = (currentTypeDef?.features ?? []).includes(
                    key,
                  );
                  const isActive = activeFeatures.has(key);
                  return (
                    <label
                      key={key}
                      className={[
                        "flex items-center gap-1.5 text-xs cursor-pointer select-none px-2 py-1 rounded border transition",
                        isActive
                          ? "bg-accent/15 border-accent text-text-primary"
                          : "border-border-secondary text-text-muted hover:text-text-primary",
                        isFromType ? "opacity-60 cursor-default" : "",
                      ].join(" ")}
                    >
                      <input
                        type="checkbox"
                        checked={isActive}
                        disabled={isFromType}
                        onChange={() => !isFromType && toggleExtraFeature(key)}
                        className="rounded border-border-secondary w-3 h-3"
                      />
                      {t(
                        `campaigns:block.blockType.feature${key.charAt(0).toUpperCase() + key.slice(1)}` as `campaigns:block.blockType.feature${string}`,
                      )}
                    </label>
                  );
                })}
              </div>
            )}
          </Section>

          {/* ── Content ── */}
          <Section title={t("campaigns:block.sections.content")}>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-text-muted">
                {t("campaigns:block.description")}
              </label>
              <MarkdownEditor
                value={formData.description}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, description: value }))
                }
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-text-muted">
                {t("campaigns:block.tags")}
              </label>
              <input
                type="text"
                value={tagsInput}
                placeholder={t("campaigns:block.tagsPlaceholder")}
                onChange={(e) => handleTagsChange(e.target.value)}
                className="bg-input-bg text-text-primary rounded px-3 py-2 border border-border-secondary focus:border-blue-500 focus:outline-none"
              />
            </div>
          </Section>

          {/* ── Organization ── */}
          <Section title={t("campaigns:block.sections.organization")}>
            {formData.children.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.children.map((childId) => {
                  const child = allBlocks.find((b) => b.id === childId);
                  return (
                    <span
                      key={childId}
                      className="flex items-center gap-1 bg-input-bg border border-border-secondary rounded px-2 py-1 text-sm text-text-primary"
                    >
                      {child?.name || childId}
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            children: prev.children.filter(
                              (id) => id !== childId,
                            ),
                          }))
                        }
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
                .filter(
                  (b) =>
                    b.id !== formData.id && !formData.children.includes(b.id),
                )
                .map((b) => ({ id: b.id, label: b.name || "Unnamed" }))}
              placeholder={t("campaigns:block.addChild")}
              onChange={(id) => {
                if (id)
                  setFormData((prev) => ({
                    ...prev,
                    children: [...prev.children, id],
                  }));
              }}
            />
          </Section>

          {/* ── Mechanics ── */}
          <Section title={t("campaigns:block.sections.mechanics")}>
            <StatCheckSection
              statChecks={formData.statChecks}
              allBlocks={allBlocks}
              onChange={handleStatChecksChange}
            />

            {hasCountdown && (
              <div className="flex flex-col gap-2 pt-1 border-t border-border-secondary">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-text-muted">
                    {t("campaigns:block.countdown.label")}
                  </label>
                  <span className="text-xs text-text-muted">
                    {t("campaigns:block.countdown.hint")}
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={formData.countdown?.max ?? 0}
                  onChange={(e) => {
                    const max = Math.max(
                      0,
                      Math.min(20, parseInt(e.target.value, 10) || 0),
                    );
                    if (max === 0) {
                      setFormData((prev) => ({
                        ...prev,
                        countdown: undefined,
                      }));
                    } else {
                      setFormData((prev) => {
                        const prev_cd = prev.countdown as
                          | CountdownData
                          | undefined;
                        const oldDescs = prev_cd?.descriptions ?? [];
                        const descriptions = Array.from(
                          { length: max },
                          (_, i) => oldDescs[i] ?? "",
                        );
                        return {
                          ...prev,
                          countdown: {
                            max,
                            current: prev_cd?.current ?? 0,
                            descriptions,
                          },
                        };
                      });
                    }
                  }}
                  className="bg-input-bg text-text-primary rounded px-3 py-2 border border-border-secondary focus:border-blue-500 focus:outline-none w-24"
                />
                {(formData.countdown?.max ?? 0) > 0 && (
                  <div className="flex flex-col gap-1.5">
                    {Array.from({ length: formData.countdown!.max }, (_, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs text-text-muted w-14 flex-shrink-0">
                          {t("campaigns:block.countdown.step", { n: i + 1 })}
                        </span>
                        <input
                          type="text"
                          value={formData.countdown?.descriptions?.[i] ?? ""}
                          placeholder={t(
                            "campaigns:block.countdown.stepPlaceholder",
                          )}
                          onChange={(e) => {
                            setFormData((prev) => {
                              const cd = prev.countdown!;
                              const descriptions = [
                                ...(cd.descriptions ?? Array(cd.max).fill("")),
                              ];
                              descriptions[i] = e.target.value;
                              return {
                                ...prev,
                                countdown: { ...cd, descriptions },
                              };
                            });
                          }}
                          className="flex-1 bg-input-bg text-text-primary rounded px-2 py-1 border border-border-secondary focus:border-blue-500 focus:outline-none text-sm"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Section>

          {/* ── Characters ── */}
          {hasCharacters && (
            <Section title={t("campaigns:block.sections.characters")}>
              {linkedNpcIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {linkedNpcIds.map((id) => {
                    const npc =
                      savedPlayers.find((p) => p.id === id) ??
                      savedMonsters.find((m) => m.id === id);
                    if (!npc) return null;
                    return (
                      <span
                        key={id}
                        className="flex items-center gap-1 bg-purple-900/30 text-purple-400 border border-purple-800/50 rounded px-2 py-0.5 text-sm"
                      >
                        <button
                          type="button"
                          onClick={() => onOpenNpc?.(id)}
                          className="hover:underline"
                        >
                          {npc.name}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setLinkedNpcIds(
                              linkedNpcIds.filter((i) => i !== id),
                            )
                          }
                          className="hover:text-red-400 transition ml-0.5"
                        >
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
                placeholder={t(
                  "campaigns:block.characterFeature.searchPlaceholder",
                )}
                onChange={(id) => {
                  if (id) setLinkedNpcIds([...linkedNpcIds, id]);
                }}
              />
            </Section>
          )}

          {/* ── Combat ── */}
          {hasCombat && (
            <Section title={t("campaigns:block.sections.combat")}>
              <SearchSelect
                items={savedCombats.map((c) => ({
                  id: c.id,
                  label: c.name,
                  icon: "⚔️",
                }))}
                value={formData.featureData?.combatId ?? undefined}
                placeholder={t(
                  "campaigns:block.combatFeature.searchPlaceholder",
                )}
                onChange={(id) => patchFeatureData({ combatId: id ?? null })}
                onOpenSelected={onOpenCombat}
                openSelectedTitle={t(
                  "campaigns:block.combatFeature.openCombat",
                )}
              />
            </Section>
          )}

          {/* ── Loot ── */}
          {hasLoot && (
            <Section title={t("campaigns:block.sections.loot")}>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">
                  {t("campaigns:block.lootFeature.items")}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    patchFeatureData({
                      items: [...(formData.featureData?.items ?? []), ""],
                    })
                  }
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
            </Section>
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

      {showCreateType && (
        <BlockTypeDialog
          editingType={
            editingTypeId
              ? blockTypes.find((tp) => tp.id === editingTypeId)
              : undefined
          }
          initialFeatures={pendingInitialFeatures}
          onConfirm={handleTypeConfirm}
          onCancel={() => setShowCreateType(false)}
        />
      )}
    </div>
  );
}
