import { ChevronDown, ChevronRight, Edit2, Swords, UserCircle, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { SavedMonster, SavedPlayer } from "../../types";
import type { BuildingBlock, BuildingBlockType } from "../../types/campaign";
import MarkdownRenderer from "../common/mardown/MarkdownRenderer";

const TYPE_ICONS: Record<BuildingBlockType, string> = {
  environment: "🌍",
  room: "🚪",
  npc: "🧙",
  combat: "⚔️",
  object: "📦",
};

interface Props {
  block: BuildingBlock;
  allBlocks: BuildingBlock[];
  savedPlayers: SavedPlayer[];
  savedMonsters: SavedMonster[];
  onClose: () => void;
  onEdit: (block: BuildingBlock) => void;
  onOpenCombat?: (combatId: string) => void;
  onOpenNpc?: (npcId: string) => void;
  onOpenBlock?: (blockId: string) => void;
}

export default function BlockDetailModal({
  block,
  allBlocks,
  savedPlayers,
  savedMonsters,
  onClose,
  onEdit,
  onOpenCombat,
  onOpenNpc,
  onOpenBlock,
}: Props) {
  const { t } = useTranslation(["campaigns", "common"]);
  const [expandedChecks, setExpandedChecks] = useState<Record<string, boolean>>({});

  const toggleCheck = (id: string) =>
    setExpandedChecks((prev) => ({ ...prev, [id]: !prev[id] }));

  const children = block.children
    .map((id) => allBlocks.find((b) => b.id === id))
    .filter((b): b is BuildingBlock => Boolean(b));

  const linkedNpcId =
    block.specialFeature?.type === "npc" ? block.specialFeature.linkedNpcId : undefined;
  const linkedNpc = linkedNpcId
    ? (savedPlayers.find((p) => p.id === linkedNpcId) ?? savedMonsters.find((m) => m.id === linkedNpcId))
    : undefined;

  const combatFeature =
    block.specialFeature?.type === "combat" ? block.specialFeature : null;

  const lootItems =
    block.specialFeature?.type === "loot" ? block.specialFeature.items.filter(Boolean) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 overflow-y-auto py-8 px-4">
      <div className="w-full max-w-2xl bg-app-bg rounded-xl border border-border-primary shadow-xl">

        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border-primary">
          <span className="text-xl flex-shrink-0">{TYPE_ICONS[block.type]}</span>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-text-primary truncate">
              {block.name || <span className="italic text-text-muted font-normal">Unnamed</span>}
            </h2>
            <span className="text-xs text-text-muted px-1.5 py-0.5 rounded border border-border-secondary">
              {t(`campaigns:block.types.${block.type}`)}
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
              <p className="text-sm text-text-muted italic">{t("common:noData")}</p>
            )}
          </div>

          {/* Special Feature */}
          {combatFeature && (
            <div className="bg-panel-bg rounded-lg border border-border-primary p-3 flex items-center justify-between gap-3">
              <span className="text-sm text-text-secondary font-medium">
                {t("campaigns:block.combatFeature.linked")}
              </span>
              {combatFeature.combatId ? (
                <button
                  onClick={() => onOpenCombat?.(combatFeature.combatId!)}
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

          {linkedNpc && (
            <div className="bg-panel-bg rounded-lg border border-border-primary p-3 flex items-center justify-between gap-3">
              <span className="text-sm text-text-secondary font-medium">
                {t("campaigns:block.npcFeature.linkedNpc")}
              </span>
              <button
                onClick={() => onOpenNpc?.(linkedNpc.id)}
                className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded text-sm transition"
              >
                <UserCircle className="w-4 h-4" />
                {linkedNpc.name}
              </button>
            </div>
          )}

          {lootItems && lootItems.length > 0 && (
            <div className="bg-panel-bg rounded-lg border border-border-primary p-3">
              <p className="text-sm font-medium text-text-secondary mb-2">
                {t("campaigns:block.lootFeature.items")}
              </p>
              <ul className="space-y-1">
                {lootItems.map((item, i) => (
                  <li key={i} className="text-sm text-text-primary flex items-center gap-2">
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
                  <div key={check.id} className="border border-border-secondary rounded bg-panel-secondary">
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 p-2 text-left"
                      onClick={() => toggleCheck(check.id)}
                    >
                      {expandedChecks[check.id]
                        ? <ChevronDown className="w-4 h-4 text-text-muted flex-shrink-0" />
                        : <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0" />
                      }
                      <span className="flex-1 text-sm text-text-primary">
                        {check.label || <span className="italic text-text-muted">Unnamed check</span>}
                      </span>
                      {check.skill && (
                        <span className="text-xs text-text-muted px-1.5 py-0.5 rounded border border-border-secondary">
                          {check.skill}
                        </span>
                      )}
                      <span className="text-xs font-mono bg-amber-600/20 text-amber-400 px-1.5 py-0.5 rounded">
                        {t("campaigns:block.difficulty")} {check.difficulty}
                      </span>
                    </button>

                    {expandedChecks[check.id] && (
                      <div className="px-3 pb-3 space-y-2">
                        {check.outcomes.map((outcome) => {
                          const linked = outcome.linkedBlockId
                            ? allBlocks.find((b) => b.id === outcome.linkedBlockId)
                            : undefined;
                          return (
                            <div key={outcome.id} className="bg-panel-bg rounded p-2 space-y-1">
                              <p className="text-xs font-semibold text-text-primary">{outcome.label}</p>
                              {outcome.description && (
                                <p className="text-xs text-text-muted">{outcome.description}</p>
                              )}
                              {linked && (
                                <button
                                  onClick={() => onOpenBlock?.(linked.id)}
                                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition"
                                >
                                  <span>{TYPE_ICONS[linked.type]}</span>
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

          {/* Child Blocks */}
          {children.length > 0 && (
            <div>
              <p className="text-sm font-medium text-text-secondary mb-2">
                {t("campaigns:block.children")}
              </p>
              <div className="flex flex-wrap gap-2">
                {children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => onOpenBlock?.(child.id)}
                    className="flex items-center gap-1.5 text-sm bg-panel-secondary hover:bg-panel-secondary/80 border border-border-secondary rounded px-2.5 py-1.5 text-text-primary transition"
                  >
                    <span>{TYPE_ICONS[child.type]}</span>
                    {child.name || <span className="italic text-text-muted">Unnamed</span>}
                  </button>
                ))}
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
