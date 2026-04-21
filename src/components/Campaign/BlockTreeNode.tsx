import {
  ChevronDown,
  ChevronRight,
  Edit2,
  GripVertical,
  Plus,
  Swords,
  Trash2,
  UserCircle,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { SavedMonster, SavedPlayer } from "../../types";
import type { BlockTypeDef, BuildingBlock } from "../../types/campaign";
import IconButton from "../common/IconButton";

export interface DragCallbacks {
  onDragStart: (blockId: string) => void;
  onDragOver: (
    targetId: string,
    position: "before" | "after" | "child",
  ) => void;
  onDrop: () => void;
  onDragEnd: () => void;
  draggedId: string | null;
  dropTarget: {
    targetId: string;
    position: "before" | "after" | "child";
  } | null;
}

interface Props {
  block: BuildingBlock;
  allBlocks: BuildingBlock[];
  blockTypes: BlockTypeDef[];
  savedPlayers: SavedPlayer[];
  savedMonsters: SavedMonster[];
  depth: number;
  reorderMode?: boolean;
  dragCallbacks?: DragCallbacks;
  selectedBlockIds?: Set<string>;
  onSelect?: (blockId: string) => void;
  onView: (block: BuildingBlock) => void;
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
  blockTypes,
  savedPlayers,
  savedMonsters,
  depth,
  reorderMode,
  dragCallbacks,
  selectedBlockIds,
  onSelect,
  onView,
  onEdit,
  onAddChild,
  onRemove,
  onOpenCombat,
  onCreateCombat,
  onOpenNpc,
}: Props) {
  const { t } = useTranslation(["campaigns", "common"]);
  const [expanded, setExpanded] = useState(depth === 0);

  const typeDef = blockTypes.find((tp) => tp.id === block.typeId);
  const displayIcon = block.icon ?? typeDef?.icon ?? "📦";
  const typeName = typeDef
    ? typeDef.isBuiltIn
      ? t(`campaigns:block.types.${typeDef.id}`)
      : typeDef.name
    : block.typeId;

  const allFeatures = [
    ...(typeDef?.features ?? []),
    ...(block.extraFeatures ?? []),
  ];
  const hasCharacters = allFeatures.includes("characters");
  const hasCombat = allFeatures.includes("combat");
  const hasLoot = allFeatures.includes("loot");

  const children = block.children
    .map((id) => allBlocks.find((b) => b.id === id))
    .filter((b): b is BuildingBlock => Boolean(b));

  const hasChildren = children.length > 0;

  const combatId = hasCombat ? (block.featureData?.combatId ?? null) : null;
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
  const firstNpc = linkedNpcs[0];
  const extraNpcCount = linkedNpcs.length - 1;
  const lootCount = hasLoot
    ? (block.featureData?.items ?? []).filter(Boolean).length
    : 0;

  const isDragged = dragCallbacks?.draggedId === block.id;
  const isSelected = selectedBlockIds?.has(block.id) ?? false;
  const dropPos =
    dragCallbacks?.dropTarget?.targetId === block.id && !isDragged
      ? dragCallbacks.dropTarget.position
      : null;

  return (
    <div className="select-none">
      <div className="relative" style={{ marginLeft: `${depth * 1.5}rem` }}>
        {/* Before insert line */}
        {dropPos === "before" && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 rounded z-10 -translate-y-px pointer-events-none" />
        )}

        {/* Card row */}
        <div
          className={[
            "flex items-center gap-2 bg-panel-bg border rounded p-3 transition",
            reorderMode
              ? "cursor-grab active:cursor-grabbing"
              : "cursor-pointer hover:border-border-secondary",
            isDragged ? "opacity-40" : "",
            dropPos === "child"
              ? "border-blue-500 bg-blue-500/5"
              : isSelected
                ? "border-blue-400 bg-blue-500/10 ring-2 ring-blue-400"
                : "border-border-primary",
          ].join(" ")}
          draggable={reorderMode}
          onDragStart={
            reorderMode
              ? (e) => {
                  e.dataTransfer.effectAllowed = "move";
                  dragCallbacks?.onDragStart(block.id);
                }
              : undefined
          }
          onDragOver={
            reorderMode
              ? (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.dataTransfer.dropEffect = "move";
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pct = (e.clientY - rect.top) / rect.height;
                  const position =
                    pct < 0.3 ? "before" : pct > 0.7 ? "after" : "child";
                  dragCallbacks?.onDragOver(block.id, position);
                }
              : undefined
          }
          onDrop={
            reorderMode
              ? (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  dragCallbacks?.onDrop();
                }
              : undefined
          }
          onDragEnd={reorderMode ? () => dragCallbacks?.onDragEnd() : undefined}
          onClick={
            reorderMode ? () => onSelect?.(block.id) : () => onView(block)
          }
        >
          {/* Drag handle or expand toggle */}
          {reorderMode ? (
            <span className="flex-shrink-0 text-text-muted w-5 flex items-center justify-center">
              <GripVertical className="w-4 h-4" />
            </span>
          ) : (
            <IconButton
              variant="ghost"
              size="sm"
              className="flex-shrink-0 w-5 flex items-center justify-center"
              onClick={(e) => {
                e.stopPropagation();
                if (hasChildren) setExpanded((v) => !v);
              }}
            >
              {hasChildren ? (
                expanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )
              ) : (
                <span className="w-4 h-4 inline-block" />
              )}
            </IconButton>
          )}

          {/* Type icon */}
          <span className="text-base flex-shrink-0">{displayIcon}</span>

          {/* Name + description */}
          <div className="flex-1 min-w-0">
            <span className="text-sm text-text-primary font-semibold truncate block">
              {block.name || (
                <span className="text-text-muted italic font-normal">
                  Unnamed
                </span>
              )}
            </span>
            {block.description && (
              <span className="text-xs text-text-muted block truncate">
                {block.description.length > 150
                  ? block.description.slice(0, 150) + "…"
                  : block.description}
              </span>
            )}
          </div>

          {!reorderMode && (
            <>
              <span className="text-xs text-text-muted hidden sm:inline-block px-1.5 py-0.5 rounded border border-border-secondary">
                {typeName}
              </span>

              {block.tags && block.tags.length > 0 && (
                <div className="hidden md:flex gap-1">
                  {block.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs text-text-muted bg-panel-secondary rounded px-1.5 py-0.5 border border-border-secondary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {block.statChecks.length > 0 && (
                <span className="text-xs text-text-muted px-1.5 py-0.5 rounded border border-border-secondary">
                  {block.statChecks.length} SC
                </span>
              )}

              {hasCombat && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (combatId) {
                      onOpenCombat?.(combatId);
                    } else {
                      onCreateCombat?.(block.id);
                    }
                  }}
                  className="flex-shrink-0 flex items-center gap-1 text-xs bg-red-900/30 text-red-400 hover:bg-red-900/50 px-2 py-1 rounded transition"
                  title={
                    combatId
                      ? t("campaigns:block.combatFeature.openCombat")
                      : t("campaigns:block.combatFeature.createCombat")
                  }
                >
                  <Swords className="w-3 h-3" />
                  <span className="hidden sm:inline">
                    {combatId
                      ? t("campaigns:block.combatFeature.openCombat")
                      : t("campaigns:block.combatFeature.createCombat")}
                  </span>
                </button>
              )}

              {firstNpc && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenNpc?.(firstNpc.id);
                  }}
                  className="flex-shrink-0 flex items-center gap-1 text-xs bg-purple-900/30 text-purple-400 hover:bg-purple-900/50 px-2 py-1 rounded transition"
                  title={firstNpc.name}
                >
                  <UserCircle className="w-3 h-3" />
                  <span className="hidden sm:inline max-w-24 truncate">
                    {firstNpc.name}
                  </span>
                  {extraNpcCount > 0 && <span>+{extraNpcCount}</span>}
                </button>
              )}

              {lootCount > 0 && (
                <span className="flex-shrink-0 flex items-center gap-1 text-xs text-text-muted px-2 py-1 rounded border border-border-secondary">
                  📦 {lootCount}
                </span>
              )}

              <div
                className="flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <IconButton
                  variant="filled"
                  size="sm"
                  onClick={() => onEdit(block)}
                  title={t("common:actions.edit")}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </IconButton>
                <IconButton
                  variant="filled"
                  size="sm"
                  onClick={() => onAddChild(block.id)}
                  className="hover:bg-blue-900/30 hover:text-blue-400"
                  title={t("campaigns:block.addChild")}
                >
                  <Plus className="w-3.5 h-3.5" />
                </IconButton>
                <IconButton
                  variant="filled"
                  size="sm"
                  onClick={() => onRemove(block.id)}
                  className="hover:bg-red-900/30 hover:text-red-400"
                  title={t("common:actions.delete")}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </IconButton>
              </div>
            </>
          )}
        </div>

        {/* After insert line */}
        {dropPos === "after" && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded z-10 translate-y-px pointer-events-none" />
        )}
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <div className="mt-1 space-y-1">
          {children.map((child) => (
            <BlockTreeNode
              key={child.id}
              block={child}
              allBlocks={allBlocks}
              blockTypes={blockTypes}
              savedPlayers={savedPlayers}
              savedMonsters={savedMonsters}
              depth={depth + 1}
              reorderMode={reorderMode}
              dragCallbacks={dragCallbacks}
              selectedBlockIds={selectedBlockIds}
              onSelect={onSelect}
              onView={onView}
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
