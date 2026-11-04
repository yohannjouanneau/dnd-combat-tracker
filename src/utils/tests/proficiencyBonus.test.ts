import {
  getEffectiveProficiencyBonus,
  getProficiencyBonusFromChallengeRating,
} from "../utils";

describe("getProficiencyBonusFromChallengeRating", () => {
  it.each([
    [0, 2],
    [0.125, 2],
    [1, 2],
    [4, 2],
    [5, 3],
    [8, 3],
    [9, 4],
    [12, 4],
    [13, 5],
    [16, 5],
    [17, 6],
    [20, 6],
    [21, 7],
    [24, 7],
    [25, 8],
    [28, 8],
    [29, 9],
    [30, 9],
  ])("CR %s gives +%s", (cr, expected) => {
    expect(getProficiencyBonusFromChallengeRating(cr)).toBe(expected);
  });

  it("returns undefined when the challenge rating is unknown", () => {
    expect(getProficiencyBonusFromChallengeRating(undefined)).toBeUndefined();
  });

  it("feeds getEffectiveProficiencyBonus when the monster has no level", () => {
    const bonus = getProficiencyBonusFromChallengeRating(5);
    expect(getEffectiveProficiencyBonus(undefined, bonus)).toBe(3);
  });
});
