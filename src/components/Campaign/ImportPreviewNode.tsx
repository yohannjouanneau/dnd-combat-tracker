import { BUILT_IN_BLOCK_TYPES } from "../../constants";
import type { ImportedBlock } from "../../utils/campaignImporter";
import IconButton from "../common/IconButton";

function getTypeIcon(typeId: string) {
  return (
    BUILT_IN_BLOCK_TYPES.find((t) => t.id === typeId)?.icon ??
    BUILT_IN_BLOCK_TYPES.find((t) => t.id === "scene")!.icon
  );
}

interface Props {
  entry: ImportedBlock;
  allBlocks: ImportedBlock[];
  depth: number;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
}

export default function ImportPreviewNode({
  entry,
  allBlocks,
  depth,
  expandedIds,
  onToggle,
}: Props) {
  const children = allBlocks.filter((b) => b.parentId === entry.block.id);
  const hasChildren = children.length > 0;
  const isExpanded = expandedIds.has(entry.block.id);

  return (
    <div>
      <div
        className="flex items-center gap-1.5 text-sm text-text-primary py-1 rounded"
        style={{ paddingLeft: `${depth * 1.25 + 0.25}rem` }}
      >
        <IconButton
          variant="ghost"
          size="sm"
          className="w-5 h-5 flex-shrink-0 flex items-center justify-center text-xs font-mono"
          onClick={() => hasChildren && onToggle(entry.block.id)}
          tabIndex={hasChildren ? 0 : -1}
        >
          {hasChildren ? (isExpanded ? "−" : "+") : ""}
        </IconButton>
        <span className="flex-shrink-0 text-base leading-none">
          {entry.block.icon ?? getTypeIcon(entry.block.typeId)}
        </span>
        <span className="font-medium truncate">{entry.block.name}</span>
        <span className="text-text-muted text-xs flex-shrink-0">
          {entry.block.typeId}
        </span>
      </div>
      {isExpanded && hasChildren && (
        <div className="border-l border-border-secondary ml-3">
          {children.map((child) => (
            <ImportPreviewNode
              key={child.block.id}
              entry={child}
              allBlocks={allBlocks}
              depth={depth + 1}
              expandedIds={expandedIds}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
