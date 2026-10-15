import { describe, expect, it } from "vitest"

import { userMessage } from "@/lib/auth/error-mapping"

function envelope(statusCode: number, message: string | string[]) {
  return { statusCode, error: "ERR", message, code: null }
}

describe("userMessage", () => {
  it.each([
    [400, "Verifique os dados informados."],
    [401, "E-mail ou senha incorretos."],
    [403, "Confirme seu e-mail antes de entrar."],
    [409, "Este e-mail já está cadastrado. Você pode"],
    [429, "Muitas tentativas. Aguarde um pouco e tente de novo."],
  ])("translates %i to Portuguese", (status, expected) => {
    expect(userMessage(envelope(status, "English upstream text"))).toBe(expected)
  })

  it("never shows the upstream English text, even for unknown statuses", () => {
    expect(userMessage(envelope(500, "Internal server error"))).toBe(
      "Não foi possível concluir agora. Tente de novo."
    )
    expect(userMessage(envelope(400, ["email must be an email"]))).not.toMatch(
      /must be/
    )
  })
})
