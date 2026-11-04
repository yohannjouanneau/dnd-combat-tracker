import { renderToStaticMarkup } from "react-dom/server";
import StatsBlock from "../StatsBlock";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const render = (props: Parameters<typeof StatsBlock>[0]) =>
  renderToStaticMarkup(<StatsBlock {...props} />);

describe("StatsBlock top row (large mode)", () => {
  it("shows only HP, AC and initiative squares, without a proficiency square", () => {
    const html = render({
      hp: 10,
      maxHp: 10,
      ac: 14,
      initiative: 2,
      derivedStats: { level: 5 },
    });

    expect(html).not.toContain("lucide-award");
    expect(html.match(/mt-auto text-2xl/g)).toHaveLength(3);
  });
});
