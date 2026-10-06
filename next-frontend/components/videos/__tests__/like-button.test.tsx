// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { LikeButton } from "../like-button"

// O like carrega a contagem e comunica o estado por aria-pressed.
describe("LikeButton", () => {
  it("renders 'Gostei · N' with the pt-BR thousands separator", () => {
    render(<LikeButton pressed={false} count={1284} />)
    expect(screen.getByRole("button", { name: "Gostei · 1.284" })).toBeInTheDocument()
  })

  it("reflects the pressed state in aria-pressed", () => {
    const { rerender } = render(<LikeButton pressed={false} count={128} />)
    expect(screen.getByRole("button", { name: "Gostei · 128" })).toHaveAttribute(
      "aria-pressed",
      "false"
    )

    rerender(<LikeButton pressed count={129} />)
    expect(screen.getByRole("button", { name: "Gostei · 129" })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
  })
})
