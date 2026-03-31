import type { BuildingBlock } from "../../../types/campaign";

export type LayoutDirection = "TB" | "LR";

const NODE_W = 192;
const NODE_H = 100;
const H_GAP = 60;
const V_GAP = 80;

/**
 * Computes a tree layout from block.children relationships.
 * "TB" = top-to-bottom, "LR" = left-to-right.
 * Isolated nodes (no parent, no children in campaign) are placed after the tree.
 */
export function computeTreeLayout(
  blocks: BuildingBlock[],
  blockIds: Set<string>,
  direction: LayoutDirection,
): Map<string, { x: number; y: number }> {
  const campaignBlocks = blocks.filter((b) => blockIds.has(b.id));

  const childrenMap = new Map<string, string[]>();
  for (const b of campaignBlocks) {
    childrenMap.set(
      b.id,
      b.children.filter((id) => blockIds.has(id)),
    );
  }

  const allChildIds = new Set(
    campaignBlocks.flatMap((b) => childrenMap.get(b.id) ?? []),
  );
  const roots = campaignBlocks.filter(
    (b) => !allChildIds.has(b.id) && (childrenMap.get(b.id)?.length ?? 0) > 0,
  );
  const isolated = campaignBlocks.filter(
    (b) => !allChildIds.has(b.id) && (childrenMap.get(b.id)?.length ?? 0) === 0,
  );

  const positions = new Map<string, { x: number; y: number }>();

  let level = 0;
  let currentLevel = roots.map((b) => b.id);
  const visited = new Set<string>();

  while (currentLevel.length > 0) {
    if (direction === "TB") {
      const y = level * (NODE_H + V_GAP);
      const totalWidth =
        currentLevel.length * NODE_W + (currentLevel.length - 1) * H_GAP;
      const startX = -totalWidth / 2;
      currentLevel.forEach((id, i) => {
        positions.set(id, { x: startX + i * (NODE_W + H_GAP), y });
        visited.add(id);
      });
    } else {
      const x = level * (NODE_W + H_GAP);
      const totalHeight =
        currentLevel.length * NODE_H + (currentLevel.length - 1) * V_GAP;
      const startY = -totalHeight / 2;
      currentLevel.forEach((id, i) => {
        positions.set(id, { x, y: startY + i * (NODE_H + V_GAP) });
        visited.add(id);
      });
    }
    const nextLevel: string[] = [];
    for (const id of currentLevel) {
      for (const childId of childrenMap.get(id) ?? []) {
        if (!visited.has(childId)) nextLevel.push(childId);
      }
    }
    currentLevel = nextLevel;
    level++;
  }

  isolated.forEach((b, i) => {
    if (direction === "TB") {
      const isolatedY = level * (NODE_H + V_GAP);
      const totalWidth =
        isolated.length * NODE_W + (isolated.length - 1) * H_GAP;
      positions.set(b.id, {
        x: -totalWidth / 2 + i * (NODE_W + H_GAP),
        y: isolatedY,
      });
    } else {
      const isolatedX = level * (NODE_W + H_GAP);
      const totalHeight =
        isolated.length * NODE_H + (isolated.length - 1) * V_GAP;
      positions.set(b.id, {
        x: isolatedX,
        y: -totalHeight / 2 + i * (NODE_H + V_GAP),
      });
    }
  });

  return positions;
}
