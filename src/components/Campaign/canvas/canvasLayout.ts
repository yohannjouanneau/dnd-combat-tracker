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
  const isLR = direction === "LR";
  const [mainSize, mainGap, crossSize, crossGap] = isLR
    ? [NODE_W, H_GAP, NODE_H, V_GAP]
    : [NODE_H, V_GAP, NODE_W, H_GAP];

  function place(ids: string[], level: number) {
    const main = level * (mainSize + mainGap);
    const totalCross = ids.length * crossSize + (ids.length - 1) * crossGap;
    const startCross = -totalCross / 2;
    ids.forEach((id, i) => {
      const cross = startCross + i * (crossSize + crossGap);
      positions.set(id, isLR ? { x: main, y: cross } : { x: cross, y: main });
    });
  }

  let level = 0;
  let currentLevel = roots.map((b) => b.id);
  const visited = new Set<string>();

  while (currentLevel.length > 0) {
    place(currentLevel, level);
    currentLevel.forEach((id) => visited.add(id));
    currentLevel = currentLevel.flatMap((id) =>
      (childrenMap.get(id) ?? []).filter((cid) => !visited.has(cid)),
    );
    level++;
  }

  place(
    isolated.map((b) => b.id),
    level,
  );

  return positions;
}
