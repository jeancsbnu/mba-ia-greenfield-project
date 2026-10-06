import { describe, expect, it } from "vitest"

import { DEFAULT_RETURN_TO } from "@/lib/auth/refresh-redirect"
import { buildLoginHref, safeReturnTo } from "@/lib/auth/return-to"

// O validador compartilhado pela rota de refresh e pelo login
// (social-interactions-anonymous-gate/TD-03): só caminho interno passa.
describe("safeReturnTo", () => {
  it("accepts an internal path, query included", () => {
    expect(safeReturnTo("/videos/abc123?t=10")).toBe("/videos/abc123?t=10")
    expect(safeReturnTo("/@joana_cria")).toBe("/@joana_cria")
  })

  it.each([
    ["absent", null],
    ["undefined", undefined],
    ["empty", ""],
    ["absolute URL", "https://outro.site/x"],
    ["protocol-relative", "//outro.site"],
    ["backslash protocol-relative", "/\\outro.site"],
    ["relative without slash", "videos/abc123"],
  ])("falls back to the default for %s", (_label, raw) => {
    expect(safeReturnTo(raw)).toBe(DEFAULT_RETURN_TO)
  })
})

describe("buildLoginHref", () => {
  it("encodes the return path into the login query", () => {
    expect(buildLoginHref("/videos/abc123")).toBe(
      "/login?returnTo=%2Fvideos%2Fabc123"
    )
    expect(buildLoginHref("/@joana_cria")).toBe("/login?returnTo=%2F%40joana_cria")
  })
})
