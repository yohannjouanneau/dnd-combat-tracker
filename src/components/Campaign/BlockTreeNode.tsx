import { ChevronDown, ChevronRight, Edit2, Plus, Swords, Trash2, UserCircle } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { SavedMonster, SavedPlayer } from "../../types";
import type { BuildingBlock, BuildingBlockType } from "../../types/campaign";

const TYPE_ICONS: Record<BuildingBlockType, string> = {
  environment: "🌍",
  room: "🚪",
  npc: "🧙",
  combat: "⚔️",
  object: "📦",
};

const TYPE_COLORS: Record<BuildingBlockType, string> = {
  environment: "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30",
  room: "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30",
  npc: "text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30",
  combat: "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30",
  object: "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30",
};

interface Props {
  block: BuildingBlock;
  allBlocks: BuildingBlock[];
  savedPlayers: SavedPlayer[];
  savedMonsters: SavedMonster[];
  depth: number;
  onEdit: (block: BuildingBlock) => void;
  onAddChild: (parentId: string) => void;
  onRemove: (blockId: string) => void;
  onOpenCombat?: (combatId: string) => void;
  onCreateCombat?: (blockId: string) => void;
  onOpenNpc?: (npcId: string) => void;
}

export default function BlockTreeNode({
  block,
  allBlocks,
  savedPlayers,
  savedMonsters,
  depth,
  onEdit,
  onAddChild,
  onRemove,
  onOpenCombat,
  onCreateCombat,
  onOpenNpc,
}: Props) {
  const { t } = useTranslation(["campaigns", "common"]);
  const [expanded, setExpanded] = useState(depth === 0);

  const children = block.children
    .map((id) => allBlocks.find((b) => b.id === id))
    .filter((b): b is BuildingBlock => Boolean(b));

  const hasChildren = children.length > 0;

  const combatFeature =
    block.specialFeature?.type === "combat" ? block.specialFeature : null;

  const linkedNpcId =
    block.specialFeature?.type === "npc" ? block.specialFeature.linkedNpcId : undefined;
  const linkedNpc = linkedNpcId
    ? (savedPlayers.find((p) => p.id === linkedNpcId) ?? savedMonsters.find((m) => m.id === linkedNpcId))
    : undefined;

  return (
    <div className="select-none">
      {/* Card row */}
      <div
        className="flex items-center gap-2 bg-panel-bg border border-border-primary hover:border-border-secondary rounded p-3 transition"
        style={{ marginLeft: `${depth * 1.5}rem` }}
      >
        {/* Expand/Collapse toggle */}
        <button
          className="flex-shrink-0 text-text-muted hover:text-text-primary transition w-5"
          onClick={() => hasChildren && setExpanded((v) => !v)}
        >
          {hasChildren ? (
            expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
          ) : (
            <span className="w-4 h-4 inline-block" />
          )}
        </button>

        {/* Type icon */}
        <span className="text-base flex-shrink-0">{TYPE_ICONS[block.type]}</span>

        {/* Name + description */}
        <div className="flex-1 min-w-0">
          <span className="text-sm text-text-primary font-semibold truncate block">
            {block.name || <span className="text-text-muted italic font-normal">Unnamed</span>}
          </span>
          {block.description && (
            <span className="text-xs text-text-muted block truncate">
              {block.description.length > 150 ? block.description.slice(0, 150) + "…" : block.description}
            </span>
          )}
        </div>

        {/* Type */}
        <span className="text-xs text-text-muted hidden sm:inline-block px-1.5 py-0.5 rounded border border-border-secondary">
          {t(`campaigns:block.types.${block.type}`)}
        </span>

        {/* Tags */}
        {block.tags && block.tags.length > 0 && (
          <div className="hidden md:flex gap-1">
            {block.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="text-xs text-text-muted bg-panel-secondary rounded px-1.5 py-0.5 border border-border-secondary">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Stat checks count */}
        {block.statChecks.length > 0 && (
          <span className="text-xs text-text-muted px-1.5 py-0.5 rounded border border-border-secondary">
            {block.statChecks.length} SC
          </span>
        )}

        {/* Combat block action */}
        {combatFeature && (
          <button
            onClick={() =>
              combatFeature.combatId
                ? onOpenCombat?.(combatFeature.combatId)
                : onCreateCombat?.(block.id)
            }
            className="flex-shrink-0 flex items-center gap-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 px-2 py-1 rounded transition"
            title={combatFeature.combatId
              ? t("campaigns:block.combatFeature.openCombat")
              : t("campaigns:block.combatFeature.createCombat")
            }
          >
            <Swords className="w-3 h-3" />
            <span className="hidden sm:inline">
              {combatFeature.combatId
                ? t("campaigns:block.combatFeature.openCombat")
                : t("campaigns:block.combatFeature.createCombat")
              }
            </span>
          </button>
        )}

        {/* NPC link button */}
        {linkedNpc && (
          <button
            onClick={() => onOpenNpc?.(linkedNpc.id)}
            className="flex-shrink-0 flex items-center gap-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50 px-2 py-1 rounded transition"
            title={linkedNpc.name}
          >
            <UserCircle className="w-3 h-3" />
            <span className="hidden sm:inline max-w-24 truncate">{linkedNpc.name}</span>
          </button>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(block)}
            className="p-1.5 rounded bg-panel-secondary hover:bg-panel-secondary/80 text-text-secondary hover:text-text-primary transition"
            title={t("common:actions.edit")}
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onAddChild(block.id)}
            className="p-1.5 rounded bg-panel-secondary hover:bg-blue-100 dark:hover:bg-blue-900/30 text-text-secondary hover:text-blue-600 dark:hover:text-blue-400 transition"
            title={t("campaigns:block.addChild")}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onRemove(block.id)}
            className="p-1.5 rounded bg-panel-secondary hover:bg-red-100 dark:hover:bg-red-900/30 text-text-secondary hover:text-red-600 dark:hover:text-red-400 transition"
            title={t("common:actions.delete")}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <div className="mt-1 space-y-1">
          {children.map((child) => (
            <BlockTreeNode
              key={child.id}
              block={child}
              allBlocks={allBlocks}
              savedPlayers={savedPlayers}
              savedMonsters={savedMonsters}
              depth={depth + 1}
              onEdit={onEdit}
              onAddChild={onAddChild}
              onRemove={onRemove}
              onOpenCombat={onOpenCombat}
              onCreateCombat={onCreateCombat}
              onOpenNpc={onOpenNpc}
            />
          ))}
        </div>
      )}
    </div>
  );
}
