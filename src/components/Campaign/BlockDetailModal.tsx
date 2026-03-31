import {
  ChevronDown,
  ChevronRight,
  Edit2,
  Swords,
  Timer,
  UserCircle,
  X,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { SavedMonster, SavedPlayer } from "../../types";
import type { BlockTypeDef, BuildingBlock } from "../../types/campaign";
import MarkdownRenderer from "../common/mardown/MarkdownRenderer";
import StatsBlock from "../common/StatsBlock";
import { getStatModifier } from "../../utils/utils";

function getTypeName(
  type: BlockTypeDef | undefined,
  id: string,
  t: (key: string) => string,
): string {
  if (!type) return id;
  return type.isBuiltIn ? t(`campaigns:block.types.${type.id}`) : type.name;
}

interface Props {
  block: BuildingBlock;
  allBlocks: BuildingBlock[];
  blockTypes: BlockTypeDef[];
  savedPlayers: SavedPlayer[];
  savedMonsters: SavedMonster[];
  onClose: () => void;
  onEdit: (block: BuildingBlock) => void;
  onOpenCombat?: (combatId: string) => void;
  onOpenBlock?: (blockId: string) => void;
  onUpdateBlock?: (
    id: string,
    patch: Partial<BuildingBlock>,
  ) => Promise<BuildingBlock>;
}

export default function BlockDetailModal({
  block,
  allBlocks,
  blockTypes,
  savedPlayers,
  savedMonsters,
  onClose,
  onEdit,
  onOpenCombat,
  onOpenBlock,
  onUpdateBlock,
}: Props) {
  const { t } = useTranslation(["campaigns", "common"]);
  const [expandedChecks, setExpandedChecks] = useState<Record<string, boolean>>(
    {},
  );
  const [countdownCurrent, setCountdownCurrent] = useState(
    block.countdown?.current ?? 0,
  );

  const toggleCheck = (id: string) =>
    setExpandedChecks((prev) => ({ ...prev, [id]: !prev[id] }));

  const typeDef = blockTypes.find((tp) => tp.id === block.typeId);
  const displayIcon = block.icon ?? typeDef?.icon ?? "📦";
  const hasCharacters = typeDef?.features.includes("characters") ?? false;
  const hasCombat = typeDef?.features.includes("combat") ?? false;
  const hasLoot = typeDef?.features.includes("loot") ?? false;
  const hasCountdown = typeDef?.features.includes("countdown") ?? false;

  const children = block.children
    .map((id) => allBlocks.find((b) => b.id === id))
    .filter((b): b is BuildingBlock => Boolean(b));

  const linkedNpcIds = hasCharacters
    ? (block.featureData?.linkedNpcIds ?? [])
    : [];
  const linkedNpcs = linkedNpcIds
    .map(
      (id) =>
        savedPlayers.find((p) => p.id === id) ??
        savedMonsters.find((m) => m.id === id),
    )
    .filter((n): n is NonNullable<typeof n> => Boolean(n));

  const [selectedNpcId, setSelectedNpcId] = useState<string | undefined>(
    () => linkedNpcs[0]?.id,
  );

  const combatId = hasCombat ? (block.featureData?.combatId ?? null) : null;
  const lootItems = hasLoot
    ? (block.featureData?.items ?? []).filter(Boolean)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 overflow-y-auto py-8 px-4">
      <div className="w-full max-w-2xl bg-app-bg rounded-xl border border-border-primary shadow-xl">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border-primary">
          <span className="text-xl flex-shrink-0">{displayIcon}</span>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-text-primary truncate">
              {block.name || (
                <span className="italic text-text-muted font-normal">
                  Unnamed
                </span>
              )}
            </h2>
            <span className="text-xs text-text-muted px-1.5 py-0.5 rounded border border-border-secondary">
              {getTypeName(typeDef, block.typeId, t)}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => onEdit(block)}
              className="p-2 rounded bg-panel-secondary hover:bg-panel-secondary/80 text-text-secondary hover:text-text-primary transition"
              title={t("common:actions.edit")}
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded bg-panel-secondary hover:bg-panel-secondary/80 text-text-secondary hover:text-text-primary transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 space-y-5">
          {/* Tags */}
          {block.tags && block.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {block.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs text-text-muted bg-panel-secondary rounded px-2 py-0.5 border border-border-secondary"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          <div>
            {block.description ? (
              <div className="prose prose-invert prose-sm max-w-none text-text-primary">
                <MarkdownRenderer content={block.description} />
              </div>
            ) : (
              <p className="text-sm text-text-muted italic">
                {t("common:noData")}
              </p>
            )}
          </div>

          {/* Combat feature */}
          {hasCombat && (
            <div className="bg-panel-bg rounded-lg border border-border-primary p-3 flex items-center justify-between gap-3">
              <span className="text-sm text-text-secondary font-medium">
                {t("campaigns:block.combatFeature.linked")}
              </span>
              {combatId ? (
                <button
                  onClick={() => onOpenCombat?.(combatId)}
                  className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm transition"
                >
                  <Swords className="w-4 h-4" />
                  {t("campaigns:block.combatFeature.openCombat")}
                </button>
              ) : (
                <span className="text-sm text-text-muted italic">
                  {t("campaigns:block.combatFeature.unlinked")}
                </span>
              )}
            </div>
          )}

          {/* Characters feature */}
          {hasCharacters &&
            linkedNpcs.length > 0 &&
            (() => {
              const selectedNpc = linkedNpcs.find(
                (n) => n.id === selectedNpcId,
              );
              return (
                <div className="bg-panel-bg rounded-lg border border-border-primary p-3 flex flex-col gap-3">
                  <span className="text-sm text-text-secondary font-medium">
                    {t("campaigns:block.characterFeature.linkedNpcs")}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {linkedNpcs.map((npc) => (
                      <button
                        key={npc.id}
                        onClick={() => setSelectedNpcId(npc.id)}
                        className={[
                          "flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition",
                          npc.id === selectedNpcId
                            ? "bg-purple-600 text-white"
                            : "bg-purple-900/30 text-purple-400 hover:bg-purple-900/50",
                        ].join(" ")}
                      >
                        <UserCircle className="w-4 h-4" />
                        {npc.name}
                      </button>
                    ))}
                  </div>
                  {selectedNpc && (
                    <div className="border-t border-border-secondary pt-3 space-y-4">
                      <StatsBlock
                        mode="compact"
                        hp={selectedNpc.hp}
                        maxHp={selectedNpc.maxHp}
                        ac={selectedNpc.ac}
                        initiative={
                          selectedNpc.initBonus ??
                          getStatModifier(selectedNpc.dex)
                        }
                        scores={{
                          str: selectedNpc.str,
                          dex: selectedNpc.dex,
                          con: selectedNpc.con,
                          int: selectedNpc.int,
                          wis: selectedNpc.wis,
                          cha: selectedNpc.cha,
                        }}
                        derivedStats={selectedNpc}
                      />
                      {selectedNpc.notes ? (
                        <div className="prose prose-invert prose-sm max-w-none text-text-primary">
                          <MarkdownRenderer content={selectedNpc.notes} />
                        </div>
                      ) : (
                        <p className="text-sm text-text-muted italic">
                          {t("common:noData")}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

          {/* Loot feature */}
          {hasLoot && lootItems && lootItems.length > 0 && (
            <div className="bg-panel-bg rounded-lg border border-border-primary p-3">
              <p className="text-sm font-medium text-text-secondary mb-2">
                {t("campaigns:block.lootFeature.items")}
              </p>
              <ul className="space-y-1">
                {lootItems.map((item, i) => (
                  <li
                    key={i}
                    className="text-sm text-text-primary flex items-center gap-2"
                  >
                    <span className="text-text-muted">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Stat Checks */}
          {block.statChecks.length > 0 && (
            <div>
              <p className="text-sm font-medium text-text-secondary mb-2">
                {t("campaigns:block.statChecks")}
              </p>
              <div className="space-y-2">
                {block.statChecks.map((check) => (
                  <div
                    key={check.id}
                    className="border border-border-secondary rounded bg-panel-secondary"
                  >
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 p-2 text-left"
                      onClick={() => toggleCheck(check.id)}
                    >
                      {expandedChecks[check.id] ? (
                        <ChevronDown className="w-4 h-4 text-text-muted flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0" />
                      )}
                      <span className="flex-1 text-sm text-text-primary">
                        {check.label || (
                          <span className="italic text-text-muted">
                            Unnamed check
                          </span>
                        )}
                      </span>
                      {check.skill && (
                        <span className="text-xs text-text-muted px-1.5 py-0.5 rounded border border-border-secondary">
                          {check.skill}
                        </span>
                      )}
                      <span className="text-xs text-text-muted px-1.5 py-0.5 rounded border border-border-secondary">
                        {t("campaigns:block.difficulty")} {check.difficulty}
                      </span>
                    </button>

                    {expandedChecks[check.id] && (
                      <div className="px-3 pb-3 space-y-2">
                        {check.outcomes.map((outcome) => {
                          const linked = outcome.linkedBlockId
                            ? allBlocks.find(
                                (b) => b.id === outcome.linkedBlockId,
                              )
                            : undefined;
                          const linkedTypeDef = linked
                            ? blockTypes.find((tp) => tp.id === linked.typeId)
                            : undefined;
                          return (
                            <div
                              key={outcome.id}
                              className="bg-panel-bg rounded p-2 space-y-1"
                            >
                              <p className="text-xs font-semibold text-text-primary">
                                {outcome.label}
                              </p>
                              {outcome.description && (
                                <p className="text-xs text-text-muted">
                                  {outcome.description}
                                </p>
                              )}
                              {linked && (
                                <button
                                  onClick={() => onOpenBlock?.(linked.id)}
                                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition"
                                >
                                  <span>
                                    {linked.icon ?? linkedTypeDef?.icon ?? "📦"}
                                  </span>
                                  {linked.name}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Countdown */}
          {hasCountdown && block.countdown && block.countdown.max > 0 && (
            <div className="bg-panel-bg rounded-lg border border-border-primary p-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-text-muted" />
                  <span className="text-sm font-medium text-text-secondary">
                    {t("campaigns:block.countdown.label")}
                  </span>
                </div>
                <span className="text-xs text-text-muted">
                  {t("campaigns:block.countdown.progress", {
                    current: countdownCurrent,
                    max: block.countdown.max,
                  })}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: block.countdown.max }, (_, i) => {
                  const boxIndex = i + 1;
                  const isElapsed = boxIndex <= countdownCurrent;
                  const pastHalfway =
                    countdownCurrent > block.countdown!.max / 2;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        if (!onUpdateBlock || !block.countdown) return;
                        const next =
                          boxIndex <= countdownCurrent
                            ? boxIndex - 1
                            : boxIndex;
                        setCountdownCurrent(next);
                        onUpdateBlock(block.id, {
                          countdown: { ...block.countdown, current: next },
                        });
                      }}
                      className={[
                        "w-7 h-7 rounded border transition",
                        isElapsed
                          ? "bg-red-700 border-red-600"
                          : pastHalfway
                            ? "bg-panel-secondary border-amber-500/60 hover:border-amber-400"
                            : "bg-panel-secondary border-border-secondary hover:border-border-primary",
                      ].join(" ")}
                    />
                  );
                })}
              </div>
              {block.countdown.descriptions?.some(Boolean) && (
                <div className="mt-2 space-y-1">
                  {block.countdown.descriptions.map((desc, i) =>
                    desc ? (
                      <div
                        key={i}
                        className={[
                          "flex items-baseline gap-2 text-xs",
                          i + 1 <= countdownCurrent
                            ? "text-red-400/70"
                            : "text-text-muted",
                        ].join(" ")}
                      >
                        <span className="flex-shrink-0 font-medium">
                          {i + 1}.
                        </span>
                        <span>{desc}</span>
                      </div>
                    ) : null,
                  )}
                </div>
              )}
            </div>
          )}

          {/* Child Blocks */}
          {children.length > 0 && (
            <div>
              <p className="text-sm font-medium text-text-secondary mb-2">
                {t("campaigns:block.children")}
              </p>
              <div className="flex flex-wrap gap-2">
                {children.map((child) => {
                  const childTypeDef = blockTypes.find(
                    (tp) => tp.id === child.typeId,
                  );
                  return (
                    <button
                      key={child.id}
                      onClick={() => onOpenBlock?.(child.id)}
                      className="flex items-center gap-1.5 text-sm bg-panel-secondary hover:bg-panel-secondary/80 border border-border-secondary rounded px-2.5 py-1.5 text-text-primary transition"
                    >
                      <span>{child.icon ?? childTypeDef?.icon ?? "📦"}</span>
                      {child.name || (
                        <span className="italic text-text-muted">Unnamed</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-border-primary">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-panel-secondary hover:bg-panel-secondary/80 text-text-primary text-sm transition"
          >
            {t("common:actions.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
