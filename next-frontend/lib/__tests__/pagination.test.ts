import { describe, it, expect } from "vitest";

import {
  OWNER_PAGE_SIZE,
  parsePage,
  toOffset,
  totalPages,
} from "@/lib/pagination";

describe("parsePage", () => {
  it("returns the page when the value is a positive integer", () => {
    expect(parsePage("3")).toBe(3);
  });

  it("defaults to 1 when the param is absent", () => {
    expect(parsePage(undefined)).toBe(1);
  });

  it.each(["0", "-2", "abc", "", "1.5", "1e3", "0x10", " "])(
    "falls back to 1 for the invalid value %j",
    (raw) => {
      expect(parsePage(raw)).toBe(1);
    }
  );

  it("tolerates surrounding whitespace", () => {
    expect(parsePage(" 4 ")).toBe(4);
  });

  it("uses the first entry when the param repeats", () => {
    // ?page=2&page=9 chega como array no Next.
    expect(parsePage(["2", "9"])).toBe(2);
  });

  it("falls back to 1 beyond the safe integer range", () => {
    expect(parsePage("99999999999999999999")).toBe(1);
  });
});

describe("toOffset", () => {
  it("maps page 1 to offset 0", () => {
    expect(toOffset(1, OWNER_PAGE_SIZE)).toBe(0);
  });

  it("maps page 3 to the third slice", () => {
    expect(toOffset(3, OWNER_PAGE_SIZE)).toBe(20);
  });
});

describe("totalPages", () => {
  it("rounds a partial last page up", () => {
    expect(totalPages(12, OWNER_PAGE_SIZE)).toBe(2);
  });

  it("returns 1 for an empty channel so page 1 still exists", () => {
    expect(totalPages(0, OWNER_PAGE_SIZE)).toBe(1);
  });
});
