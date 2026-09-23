import { describe, it, expect } from "vitest";

import { channelEditSchema } from "@/lib/channels/edit-schema";

const VALID = {
  nickname: "joana_cria",
  name: "Joana Cria",
  description: "Canal de tutoriais",
};

describe("channelEditSchema", () => {
  it("accepts a valid payload", () => {
    expect(channelEditSchema.safeParse(VALID).success).toBe(true);
  });

  it("rejects the dotted nickname shown in the Figma mock", () => {
    // "joana.cria" aparece no design e o backend rejeita: barrar antes evita
    // um round-trip só para receber 400.
    const result = channelEditSchema.safeParse({
      ...VALID,
      nickname: "joana.cria",
    });
    expect(result.success).toBe(false);
  });

  it.each(["Joana", "joana cria", "joana-cria", "joana@cria", "joaná"])(
    "rejects the nickname %j",
    (nickname) => {
      expect(channelEditSchema.safeParse({ ...VALID, nickname }).success).toBe(
        false
      );
    }
  );

  it.each(["joana", "joana_cria", "canal123", "_underscore"])(
    "accepts the nickname %j",
    (nickname) => {
      expect(channelEditSchema.safeParse({ ...VALID, nickname }).success).toBe(
        true
      );
    }
  );

  it("rejects an empty nickname", () => {
    expect(
      channelEditSchema.safeParse({ ...VALID, nickname: "  " }).success
    ).toBe(false);
  });

  it("rejects a nickname longer than 50 characters", () => {
    expect(
      channelEditSchema.safeParse({ ...VALID, nickname: "a".repeat(51) })
        .success
    ).toBe(false);
  });

  it("rejects an empty channel name", () => {
    expect(channelEditSchema.safeParse({ ...VALID, name: "" }).success).toBe(
      false
    );
  });

  it("accepts an empty description", () => {
    expect(
      channelEditSchema.safeParse({ ...VALID, description: "" }).success
    ).toBe(true);
  });
});
