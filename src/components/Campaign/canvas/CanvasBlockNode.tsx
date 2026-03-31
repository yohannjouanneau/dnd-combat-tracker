import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import { Edit2 } from "lucide-react";
import type { BuildingBlock, BlockTypeDef } from "../../../types/campaign";

const TYPE_BORDER_COLORS: Record<string, string> = {
  environment: "border-l-green-500",
  room: "border-l-blue-500",
  character: "border-l-purple-500",
  combat: "border-l-red-500",
  loot: "border-l-yellow-500",
};

export interface CanvasBlockNodeData extends Record<string, unknown> {
  block: BuildingBlock;
  typeDef: BlockTypeDef | undefined;
  onView: (block: BuildingBlock) => void;
  onEdit: (block: BuildingBlock) => void;
}

export default function CanvasBlockNode({ data, selected }: NodeProps) {
  const { block, typeDef, onView, onEdit } = data as CanvasBlockNodeData;

  const displayIcon = block.icon ?? typeDef?.icon ?? "📦";
  const typeName = typeDef
    ? typeDef.isBuiltIn
      ? typeDef.id
      : typeDef.name
    : block.typeId;
  const borderColor =
    TYPE_BORDER_COLORS[block.typeId] ?? "border-l-border-secondary";

  const countdownMax = block.countdown?.max ?? 0;
  const countdownCurrent = block.countdown?.current ?? 0;

  return (
    <div
      className={[
        "w-48 bg-panel-bg border border-border-primary border-l-4 rounded-lg shadow-lg transition",
        borderColor,
        selected ? "ring-2 ring-blue-500" : "",
      ].join(" ")}
    >
      <Handle
        id="top"
        type="target"
        position={Position.Top}
        className="!bg-border-secondary !border-border-primary !w-2.5 !h-2.5"
      />
      <Handle
        id="left"
        type="target"
        position={Position.Left}
        className="!bg-border-secondary !border-border-primary !w-2.5 !h-2.5"
      />

      {/* Card body — click to view */}
      <div className="p-3 cursor-pointer" onClick={() => onView(block)}>
        {/* Header row */}
        <div className="flex items-start justify-between gap-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-base flex-shrink-0">{displayIcon}</span>
            <span className="text-sm font-semibold text-text-primary truncate leading-tight">
              {block.name || (
                <span className="text-text-muted italic font-normal">
                  Unnamed
                </span>
              )}
            </span>
          </div>
          <button
            type="button"
            className="flex-shrink-0 p-0.5 rounded text-text-muted hover:text-text-primary hover:bg-panel-secondary transition"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(block);
            }}
          >
            <Edit2 className="w-3 h-3" />
          </button>
        </div>

        {/* Type badge + tags */}
        <div className="flex flex-wrap gap-1 mt-1.5">
          <span className="text-[10px] text-text-muted bg-panel-secondary px-1.5 py-0.5 rounded border border-border-secondary">
            {typeName}
          </span>
          {(block.tags ?? []).slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-[10px] text-text-muted bg-panel-secondary px-1.5 py-0.5 rounded border border-border-secondary"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Countdown bar */}
        {countdownMax > 0 && (
          <div className="mt-2">
            <div className="flex gap-0.5">
              {Array.from({ length: countdownMax }, (_, i) => (
                <div
                  key={i}
                  className={[
                    "flex-1 h-1.5 rounded-sm",
                    i < countdownCurrent ? "bg-red-600" : "bg-panel-secondary",
                  ].join(" ")}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <Handle
        id="right"
        type="source"
        position={Position.Right}
        className="!bg-border-secondary !border-border-primary !w-2.5 !h-2.5"
      />
      <Handle
        id="bottom"
        type="source"
        position={Position.Bottom}
        className="!bg-border-secondary !border-border-primary !w-2.5 !h-2.5"
      />
    </div>
  );
}
