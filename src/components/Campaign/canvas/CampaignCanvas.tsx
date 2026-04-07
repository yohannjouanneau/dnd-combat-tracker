import "@xyflow/react/dist/style.css";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  Panel,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type OnConnect,
  type EdgeMouseHandler,
} from "@xyflow/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { LayoutDashboard } from "lucide-react";
import type {
  BuildingBlock,
  BlockTypeDef,
  Campaign,
  CanvasNode,
} from "../../../types/campaign";
import CanvasBlockNode, { type CanvasBlockNodeData } from "./CanvasBlockNode";
import { computeTreeLayout, type LayoutDirection } from "./canvasLayout";

const NODE_TYPES = { block: CanvasBlockNode };

const CHILD_EDGE_STYLE = {
  style: { stroke: "#6b7280", strokeWidth: 1.5, strokeDasharray: "5 4" },
  markerEnd: { type: "arrowclosed" as const, color: "#6b7280" },
};

const COLS = 4;
const COL_GAP = 280;
const ROW_GAP = 200;
const edgeId = (parentId: string, childId: string) =>
  `child__${parentId}__${childId}`;

function applyAutoLayout(nodes: CanvasNode[]): CanvasNode[] {
  let index = 0;
  return nodes.map((n) => {
    if (n.x !== 0 || n.y !== 0) return n;
    const col = index % COLS;
    const row = Math.floor(index / COLS);
    index++;
    return { ...n, x: col * COL_GAP, y: row * ROW_GAP };
  });
}

function toRFNodes(
  nodes: CanvasNode[],
  blocks: BuildingBlock[],
  blockTypes: BlockTypeDef[],
  onView: (b: BuildingBlock) => void,
  onEdit: (b: BuildingBlock) => void,
  readOnly: boolean,
): Node[] {
  return nodes.flatMap((n) => {
    const block = blocks.find((b) => b.id === n.blockId);
    if (!block) return [];
    const typeDef = blockTypes.find((t) => t.id === block.typeId);
    const data: CanvasBlockNodeData = {
      block,
      typeDef,
      onView,
      onEdit,
      readOnly,
    };
    return [
      { id: n.blockId, type: "block", position: { x: n.x, y: n.y }, data },
    ];
  });
}

function toRFEdges(
  blocks: BuildingBlock[],
  blockIds: Set<string>,
  direction: LayoutDirection,
): Edge[] {
  const sourceHandle = direction === "TB" ? "bottom" : "right";
  const targetHandle = direction === "TB" ? "top" : "left";
  const edges: Edge[] = [];
  for (const block of blocks) {
    if (!blockIds.has(block.id)) continue;
    for (const childId of block.children) {
      if (!blockIds.has(childId)) continue;
      edges.push({
        id: edgeId(block.id, childId),
        source: block.id,
        target: childId,
        sourceHandle,
        targetHandle,
        ...CHILD_EDGE_STYLE,
      });
    }
  }
  return edges;
}

interface Props {
  campaign: Campaign;
  blocks: BuildingBlock[];
  blockTypes: BlockTypeDef[];
  onUpdateNodes: (campaignId: string, nodes: CanvasNode[]) => Promise<void>;
  onAddChild: (parentId: string, childId: string) => Promise<void>;
  onRemoveChild: (parentId: string, childId: string) => Promise<void>;
  onViewBlock: (block: BuildingBlock) => void;
  onEditBlock: (block: BuildingBlock) => void;
  readOnly?: boolean;
}

function CampaignCanvasInner({
  campaign,
  blocks,
  blockTypes,
  onUpdateNodes,
  onAddChild,
  onRemoveChild,
  onViewBlock,
  onEditBlock,
  readOnly = false,
}: Props) {
  const { t } = useTranslation("campaigns");
  const [layoutDir, setLayoutDir] = useState<LayoutDirection>("TB");

  const onViewBlockRef = useRef(onViewBlock);
  onViewBlockRef.current = onViewBlock;
  const onEditBlockRef = useRef(onEditBlock);
  onEditBlockRef.current = onEditBlock;

  const blockIds = useMemo(
    () => new Set(campaign.nodes.map((n) => n.blockId)),
    [campaign.nodes],
  );

  const laidOutNodes = useMemo(
    () => applyAutoLayout(campaign.nodes),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [campaign.id],
  );

  const initialNodes = useMemo(
    () =>
      toRFNodes(
        laidOutNodes,
        blocks,
        blockTypes,
        onViewBlock,
        onEditBlock,
        readOnly,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [campaign.id],
  );
  const initialEdges = useMemo(
    () => toRFEdges(blocks, blockIds, layoutDir),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [campaign.id],
  );

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState(initialNodes);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setRfNodes((previousRfNodes) => {
      const previousNodePositions = new Map(
        previousRfNodes.map((rfNode) => [rfNode.id, rfNode.position]),
      );
      return campaign.nodes.flatMap((canvasNode) => {
        const block = blocks.find((b) => b.id === canvasNode.blockId);
        if (!block) return [];
        const typeDef = blockTypes.find((t) => t.id === block.typeId);
        const savedPosition = previousNodePositions.get(canvasNode.blockId);
        const position = savedPosition ?? { x: canvasNode.x, y: canvasNode.y };
        const nodeData: CanvasBlockNodeData = {
          block,
          typeDef,
          onView: onViewBlockRef.current,
          onEdit: onEditBlockRef.current,
          readOnly,
        };
        return [
          { id: canvasNode.blockId, type: "block", position, data: nodeData },
        ];
      });
    });
    setRfEdges(() => toRFEdges(blocks, blockIds, layoutDir));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign.nodes, blocks, blockTypes, blockIds, layoutDir, readOnly]);

  const handleNodeDragStop = useCallback(
    (_e: unknown, _node: unknown, draggedNodes: Node[]) => {
      const positionMap = new Map(draggedNodes.map((n) => [n.id, n.position]));
      const updatedNodes: CanvasNode[] = campaign.nodes.map((cn) => {
        const pos = positionMap.get(cn.blockId);
        return pos ? { ...cn, x: pos.x, y: pos.y } : cn;
      });
      onUpdateNodes(campaign.id, updatedNodes);
    },
    [campaign.id, campaign.nodes, onUpdateNodes],
  );

  const handleConnect: OnConnect = useCallback(
    (connection) => {
      const parentId = connection.source;
      const childId = connection.target;
      const sourceHandle = layoutDir === "TB" ? "bottom" : "right";
      const targetHandle = layoutDir === "TB" ? "top" : "left";
      setRfEdges((eds) => {
        if (eds.some((e) => e.id === edgeId(parentId, childId))) return eds;
        return [
          ...eds,
          {
            id: edgeId(parentId, childId),
            source: parentId,
            target: childId,
            sourceHandle,
            targetHandle,
            ...CHILD_EDGE_STYLE,
          },
        ];
      });
      onAddChild(parentId, childId);
    },
    [layoutDir, onAddChild, setRfEdges],
  );

  const handleEdgeClick: EdgeMouseHandler = useCallback(
    (_e, edge) => {
      const [, parentId, childId] = edge.id.split("__");
      setRfEdges((eds) => eds.filter((e) => e.id !== edge.id));
      onRemoveChild(parentId, childId);
    },
    [onRemoveChild, setRfEdges],
  );

  const handleAutoLayout = useCallback(() => {
    const positions = computeTreeLayout(blocks, blockIds, layoutDir);
    setRfNodes((prev) =>
      prev.map((n) => {
        const pos = positions.get(n.id);
        return pos ? { ...n, position: pos } : n;
      }),
    );
    const updatedNodes: CanvasNode[] = campaign.nodes.map((cn) => {
      const pos = positions.get(cn.blockId);
      return pos ? { ...cn, x: pos.x, y: pos.y } : cn;
    });
    onUpdateNodes(campaign.id, updatedNodes);
  }, [
    blocks,
    blockIds,
    layoutDir,
    campaign.id,
    campaign.nodes,
    onUpdateNodes,
    setRfNodes,
  ]);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={NODE_TYPES}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={readOnly ? undefined : handleNodeDragStop}
        onConnect={readOnly ? undefined : handleConnect}
        onEdgeClick={readOnly ? undefined : handleEdgeClick}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        deleteKeyCode={null}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <Controls />
        <Panel position="top-right">
          <div className="flex items-center gap-1 rounded border border-border-primary bg-panel-bg shadow overflow-hidden">
            <button
              onClick={() => setLayoutDir("TB")}
              title={t("canvas.directionTB")}
              className={`px-2 py-1.5 text-xs transition ${layoutDir === "TB" ? "bg-panel-secondary text-text-primary" : "text-text-muted hover:text-text-primary"}`}
            >
              TB
            </button>
            <button
              onClick={() => setLayoutDir("LR")}
              title={t("canvas.directionLR")}
              className={`px-2 py-1.5 text-xs transition border-l border-border-primary ${layoutDir === "LR" ? "bg-panel-secondary text-text-primary" : "text-text-muted hover:text-text-primary"}`}
            >
              LR
            </button>
            <button
              onClick={handleAutoLayout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs border-l border-border-primary text-text-primary hover:bg-panel-secondary transition"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              {t("canvas.autoLayout")}
            </button>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export default function CampaignCanvas(props: Props) {
  return (
    <ReactFlowProvider>
      <CampaignCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
