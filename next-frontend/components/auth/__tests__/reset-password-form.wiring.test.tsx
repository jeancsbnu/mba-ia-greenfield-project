// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { describe, expect, it } from "vitest"

import { server } from "@/mocks/server"
import { ResetPasswordForm } from "../reset-password-form"

type User = ReturnType<typeof userEvent.setup>

async function fillPasswords(user: User, password: string, confirm = password) {
  await user.type(screen.getByLabelText("Nova senha"), password)
  await user.type(screen.getByLabelText("Confirmar nova senha"), confirm)
}

describe("<ResetPasswordForm /> wiring", () => {
  it("sends the token with the new password and shows the success state on 204", async () => {
    const user = userEvent.setup()
    const received: Record<string, unknown>[] = []
    server.use(
      http.post("/api/auth/reset-password", async ({ request }) => {
        received.push((await request.json()) as Record<string, unknown>)
        return new HttpResponse(null, { status: 204 })
      })
    )

    render(<ResetPasswordForm token="valid-reset-token" />)
    await fillPasswords(user, "novaSenha123")
    await user.click(screen.getByRole("button", { name: "Redefinir senha" }))

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Senha redefinida")
    )
    expect(received).toEqual([
      { token: "valid-reset-token", new_password: "novaSenha123" },
    ])
    expect(screen.getByRole("link", { name: "Ir para o login" })).toHaveAttribute(
      "href",
      "/login"
    )
  })

  it("swaps to the invalid-link state on 401 and offers a new link", async () => {
    const user = userEvent.setup()
    server.use(
      http.post("/api/auth/reset-password", () =>
        HttpResponse.json(
          { statusCode: 401, error: "TOKEN_EXPIRED", message: "Token has expired", code: null },
          { status: 401 }
        )
      )
    )

    render(<ResetPasswordForm token="expired-token" />)
    await fillPasswords(user, "novaSenha123")
    await user.click(screen.getByRole("button", { name: "Redefinir senha" }))

    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent("Link inválido ou expirado")
    expect(screen.getByRole("link", { name: "Pedir um novo link" })).toHaveAttribute(
      "href",
      "/forgot-password"
    )
    expect(
      screen.queryByRole("button", { name: "Redefinir senha" })
    ).not.toBeInTheDocument()
  })

  it("starts in the invalid-link state when the URL has no token", () => {
    render(<ResetPasswordForm token={null} />)

    expect(screen.getByRole("alert")).toHaveTextContent("Link inválido ou expirado")
    expect(screen.queryByLabelText("Nova senha")).not.toBeInTheDocument()
  })

  it("blocks submit on mismatched or weak passwords and fires no request", async () => {
    const user = userEvent.setup()
    let calls = 0
    server.use(
      http.post("/api/auth/reset-password", () => {
        calls += 1
        return new HttpResponse(null, { status: 204 })
      })
    )

    render(<ResetPasswordForm token="valid-reset-token" />)
    await fillPasswords(user, "novaSenha123", "outraSenha123")
    await user.click(screen.getByRole("button", { name: "Redefinir senha" }))

    expect(await screen.findByText("As senhas não coincidem")).toBeInTheDocument()

    await user.clear(screen.getByLabelText("Nova senha"))
    await user.type(screen.getByLabelText("Nova senha"), "semnumero")
    await user.click(screen.getByRole("button", { name: "Redefinir senha" }))

    expect(await screen.findByText("Inclua ao menos um número")).toBeInTheDocument()
    expect(calls).toBe(0)
  })

  it("maps a 400 to an inline error on the new password field", async () => {
    const user = userEvent.setup()
    server.use(
      http.post("/api/auth/reset-password", () =>
        HttpResponse.json(
          {
            statusCode: 400,
            error: "VALIDATION_FAILED",
            message: ["new_password must be shorter than or equal to 128 characters"],
            code: null,
          },
          { status: 400 }
        )
      )
    )

    render(<ResetPasswordForm token="valid-reset-token" />)
    await fillPasswords(user, "novaSenha123")
    await user.click(screen.getByRole("button", { name: "Redefinir senha" }))

    expect(
      await screen.findByText("Verifique os dados informados.")
    ).toBeInTheDocument()
    expect(screen.getByLabelText("Nova senha")).toHaveAttribute("aria-invalid", "true")
  })
})
