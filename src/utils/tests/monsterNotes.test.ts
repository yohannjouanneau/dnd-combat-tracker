import type { ApiMonster } from "../../api/types";
import { formatActionsAsMarkdown } from "../monsterNotes";

const base: ApiMonster = { index: "x", name: "X", image: "" };

describe("formatActionsAsMarkdown", () => {
  it("renders bonus actions, reactions and legendary actions as their own sections", () => {
    const monster: ApiMonster = {
      ...base,
      actions: [{ name: "Bite", desc: "Melee Attack Roll: +5." }],
      bonus_actions: [{ name: "Nimble Escape", desc: "Disengage or Hide." }],
      reactions: [{ name: "Parry", desc: "+2 AC." }],
      legendary_actions: [{ name: "Tail Attack", desc: "Tail hits." }],
    };

    const md = formatActionsAsMarkdown(monster);

    expect(md).toContain("## Actions");
    expect(md).toContain("## Bonus Actions");
    expect(md).toContain("**Nimble Escape**");
    expect(md).toContain("## Reactions");
    expect(md).toContain("**Parry**");
    expect(md).toContain("## Legendary Actions");
    expect(md.indexOf("## Actions")).toBeLessThan(
      md.indexOf("## Bonus Actions"),
    );
    expect(md.indexOf("## Bonus Actions")).toBeLessThan(
      md.indexOf("## Reactions"),
    );
    expect(md.indexOf("## Reactions")).toBeLessThan(
      md.indexOf("## Legendary Actions"),
    );
  });

  it("omits empty sections", () => {
    const md = formatActionsAsMarkdown({
      ...base,
      actions: [{ name: "Bite", desc: "Bite." }],
      bonus_actions: [],
    });
    expect(md).not.toContain("Bonus Actions");
    expect(md).not.toContain("Legendary Actions");
  });
});
