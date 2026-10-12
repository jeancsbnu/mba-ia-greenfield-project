import { describe, expect, it } from "vitest";

import { parseSearchTerm } from "@/lib/search";

describe("parseSearchTerm", () => {
  it.each([undefined, "", "   "])("treats %j as an empty term", (raw) => {
    expect(parseSearchTerm(raw)).toEqual({ kind: "empty" });
  });

  it.each(["ab", " ab "])("treats %j as too short", (raw) => {
    expect(parseSearchTerm(raw)).toEqual({ kind: "short", term: "ab" });
  });

  it("accepts a 3-character term, trimmed", () => {
    expect(parseSearchTerm("  abc ")).toEqual({ kind: "valid", term: "abc" });
  });

  it("uses the first value when the param repeats", () => {
    expect(parseSearchTerm(["docker", "musica"])).toEqual({
      kind: "valid",
      term: "docker",
    });
  });

  it("does not accept a term longer than 100 characters", () => {
    const term = "a".repeat(101);

    expect(parseSearchTerm(term)).toEqual({ kind: "long", term });
    expect(parseSearchTerm("a".repeat(100)).kind).toBe("valid");
  });
});
