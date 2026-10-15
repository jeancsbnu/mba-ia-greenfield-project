// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { ConfirmationNotice } from "../confirmation-notice"

describe("<ConfirmationNotice />", () => {
  it("announces a confirmed account as status", () => {
    render(<ConfirmationNotice outcome="confirmed" />)

    expect(screen.getByRole("status")).toHaveTextContent("Conta confirmada")
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("offers a new link when the confirmation link is invalid", () => {
    render(<ConfirmationNotice outcome="invalid" />)

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Link de confirmação inválido"
    )
    expect(
      screen.getByRole("link", { name: "Reenviar e-mail de confirmação" })
    ).toHaveAttribute("href", "/resend-confirmation")
  })

  it("asks to retry the same link on a transient failure", () => {
    render(<ConfirmationNotice outcome="error" />)

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Não foi possível confirmar agora"
    )
    expect(screen.queryByRole("link")).not.toBeInTheDocument()
  })
})
