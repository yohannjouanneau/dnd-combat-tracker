import { nextApiSearchMode } from "../utils";

describe("nextApiSearchMode", () => {
  it("cycles 2024 -> 2014 -> both -> 2024", () => {
    expect(nextApiSearchMode("2024")).toBe("2014");
    expect(nextApiSearchMode("2014")).toBe("both");
    expect(nextApiSearchMode("both")).toBe("2024");
  });
});
