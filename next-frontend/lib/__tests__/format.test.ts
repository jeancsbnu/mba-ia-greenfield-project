import { describe, it, expect } from "vitest";

import {
  formatCount,
  formatRelativeDate,
  formatVideosCount,
} from "@/lib/format";

describe("formatCount", () => {
  it("uses the pt-BR thousands separator", () => {
    expect(formatCount(1284)).toBe("1.284");
  });

  it("leaves small numbers untouched", () => {
    expect(formatCount(88)).toBe("88");
  });

  it("formats zero", () => {
    expect(formatCount(0)).toBe("0");
  });
});

describe("formatRelativeDate", () => {
  const now = new Date("2026-07-28T12:00:00.000Z");

  it("returns a relative label with the absolute date alongside", () => {
    const { label, absolute } = formatRelativeDate(
      "2026-07-25T12:00:00.000Z",
      now
    );

    expect(label).toBe("há 3 dias");
    expect(absolute).toContain("2026");
    expect(absolute).toContain("25");
  });

  it("uses hours for a publication earlier the same day", () => {
    const { label } = formatRelativeDate("2026-07-28T09:00:00.000Z", now);
    expect(label).toBe("há 3 horas");
  });

  it("uses months for an older publication", () => {
    const { label } = formatRelativeDate("2026-04-28T12:00:00.000Z", now);
    expect(label).toBe("há 3 meses");
  });

  it("falls back to the absolute date for a future date", () => {
    // Publicação no futuro não deveria existir; "daqui a 2 dias" seria pior
    // do que simplesmente mostrar a data.
    const { label, absolute } = formatRelativeDate(
      "2026-07-30T12:00:00.000Z",
      now
    );
    expect(label).toBe(absolute);
  });

  it("falls back to the absolute date for an unparseable value", () => {
    const { label, absolute } = formatRelativeDate("not-a-date", now);
    expect(label).toBe(absolute);
  });
});

describe("formatVideosCount", () => {
  it("uses the singular for a single video", () => {
    // O mock do Figma só mostra o plural; sem isto sairia "1 vídeos".
    expect(formatVideosCount(1)).toBe("1 vídeo");
  });

  it("uses the plural for many videos", () => {
    expect(formatVideosCount(42)).toBe("42 vídeos");
  });

  it("uses the plural for zero", () => {
    expect(formatVideosCount(0)).toBe("0 vídeos");
  });

  it("formats large counts with the thousands separator", () => {
    expect(formatVideosCount(1284)).toBe("1.284 vídeos");
  });
});
