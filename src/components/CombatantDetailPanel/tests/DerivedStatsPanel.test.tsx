import { renderToStaticMarkup } from "react-dom/server";
import DerivedStatsPanel from "../DerivedStatsPanel";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const render = (props: Parameters<typeof DerivedStatsPanel>[0]) =>
  renderToStaticMarkup(<DerivedStatsPanel {...props} />);

// Text of one saving throw pill, e.g. "forms:...dex +6" (label and value are separate spans)
const saveText = (html: string, key: string) => {
  const match = new RegExp(
    `(forms:library\\.listItem\\.abilities\\.${key})</span> <span[^>]*>([^<]*)</span>`,
  ).exec(html);
  return match ? `${match[1]} ${match[2]}` : undefined;
};

describe("DerivedStatsPanel speed (large mode)", () => {
  it("shows walk speed to the right of the proficiency bonus", () => {
    const html = render({
      combatant: { proficiencyBonus: 2, speed: { walk: "30 ft." } },
    });

    expect(html).toContain("combat:combatant.details.speed");
    expect(html).toContain("30 ft.");
    expect(html.indexOf("+2")).toBeLessThan(html.indexOf("30 ft."));
    expect(html).not.toContain("combat:combatant.details.fly");
  });

  it("shows the fly speed when the monster can fly", () => {
    const html = render({
      combatant: {
        proficiencyBonus: 2,
        speed: { walk: "30 ft.", fly: "60 ft." },
      },
    });

    expect(html).toContain("combat:combatant.details.fly");
    expect(html).toContain("60 ft.");
  });

  it("shows speed even without a proficiency bonus, without the bonus", () => {
    const html = render({ combatant: { speed: { walk: "25 ft." } } });

    expect(html).toContain("25 ft.");
    expect(html).not.toContain("combat:combatant.details.proficiencyBonus");
  });

  it("lists only the proficient saving throws with their API bonus", () => {
    const html = render({
      combatant: {
        proficiencyBonus: 3,
        savingThrows: { dex: 6, con: 5 },
      },
    });

    expect(html).toContain("combat:combatant.details.savingThrows");
    expect(saveText(html, "dex")).toBe(
      "forms:library.listItem.abilities.dex +6",
    );
    expect(saveText(html, "con")).toBe(
      "forms:library.listItem.abilities.con +5",
    );
    expect(html).not.toContain("abilities.str");
  });

  it("shows saving throws alone when no proficiency bonus is known", () => {
    const html = render({ combatant: { savingThrows: { wis: 2 } } });

    expect(saveText(html, "wis")).toBe(
      "forms:library.listItem.abilities.wis +2",
    );
    expect(html).not.toContain("combat:combatant.details.passive");
  });

  it("uses the ability modifier for non-proficient saves, API bonus taking precedence", () => {
    const html = render({
      combatant: {
        proficiencyBonus: 2,
        str: 8, // -1, not proficient
        dex: 14, // +2 from modifier, but API says +5 (proficient)
        savingThrows: { dex: 5 },
      },
    });

    expect(saveText(html, "str")).toBe(
      "forms:library.listItem.abilities.str -1",
    );
    expect(saveText(html, "dex")).toBe(
      "forms:library.listItem.abilities.dex +5",
    );
  });

  it("does not display the level, but still uses it for the proficiency bonus", () => {
    const html = render({ combatant: { level: 5 } });

    expect(html).not.toContain("combat:combatant.details.level");
    expect(html).toContain("+3");
  });

  it("renders nothing without proficiency, speed or saving throws", () => {
    expect(render({ combatant: {} })).toBe("");
  });
});
