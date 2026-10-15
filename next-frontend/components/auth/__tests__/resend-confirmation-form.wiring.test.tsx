// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { describe, expect, it } from "vitest"

import { server } from "@/mocks/server"
import { ResendConfirmationForm } from "../resend-confirmation-form"

describe("<ResendConfirmationForm /> wiring", () => {
  it("submits the email and replaces the form with an inline confirmation on 204", async () => {
    const user = userEvent.setup()
    const received: Record<string, unknown>[] = []
    server.use(
      http.post("/api/auth/resend-confirmation", async ({ request }) => {
        received.push((await request.json()) as Record<string, unknown>)
        return new HttpResponse(null, { status: 204 })
      })
    )

    render(<ResendConfirmationForm />)
    await user.type(screen.getByLabelText("E-mail"), "alice@example.com")
    await user.click(
      screen.getByRole("button", { name: "Reenviar link de confirmação" })
    )

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Verifique seu e-mail")
    )
    expect(received).toEqual([{ email: "alice@example.com" }])
    expect(
      screen.queryByRole("button", { name: "Reenviar link de confirmação" })
    ).not.toBeInTheDocument()
  })

  it("maps a 400 to an inline error on the email field", async () => {
    const user = userEvent.setup()
    server.use(
      http.post("/api/auth/resend-confirmation", () =>
        HttpResponse.json(
          { statusCode: 400, error: "VALIDATION_FAILED", message: "email must be an email", code: null },
          { status: 400 }
        )
      )
    )

    render(<ResendConfirmationForm />)
    await user.type(screen.getByLabelText("E-mail"), "alice@example.com")
    await user.click(
      screen.getByRole("button", { name: "Reenviar link de confirmação" })
    )

    expect(await screen.findByText("email must be an email")).toBeInTheDocument()
    expect(screen.getByLabelText("E-mail")).toHaveAttribute("aria-invalid", "true")
  })

  it("blocks an invalid email client-side and fires no request", async () => {
    const user = userEvent.setup()
    let calls = 0
    server.use(
      http.post("/api/auth/resend-confirmation", () => {
        calls += 1
        return new HttpResponse(null, { status: 204 })
      })
    )

    render(<ResendConfirmationForm />)
    await user.type(screen.getByLabelText("E-mail"), "nao-e-email")
    await user.click(
      screen.getByRole("button", { name: "Reenviar link de confirmação" })
    )

    expect(await screen.findByText("Endereço de e-mail inválido")).toBeInTheDocument()
    expect(calls).toBe(0)
  })
})
