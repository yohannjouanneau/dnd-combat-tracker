import type { ApiMonster } from "../../api/types";
import { getApiSpeed } from "../utils";

describe("getApiSpeed", () => {
  it("keeps only walk and fly from the API speed", () => {
    const monster = {
      index: "x",
      name: "X",
      image: "",
      speed: { walk: "30 ft.", fly: "60 ft.", swim: "20 ft.", climb: "10 ft." },
    } as ApiMonster;

    expect(getApiSpeed(monster)).toEqual({ walk: "30 ft.", fly: "60 ft." });
  });

  it("returns walk alone when the monster cannot fly", () => {
    const monster = {
      index: "x",
      name: "X",
      image: "",
      speed: { walk: "30 ft.", fly: null },
    } as unknown as ApiMonster;

    expect(getApiSpeed(monster)).toEqual({ walk: "30 ft.", fly: undefined });
  });

  it("returns undefined when the API has no speed", () => {
    const monster = { index: "x", name: "X", image: "" } as ApiMonster;

    expect(getApiSpeed(monster)).toBeUndefined();
  });
});
