// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { DislikeButton } from "../dislike-button"

// Dislike sem número em qualquer estado (social-interactions/TD-03); o estado
// vai por aria-pressed.
describe("DislikeButton", () => {
  it.each([false, true])(
    "renders 'Não gostei' without any count (pressed=%s)",
    (pressed) => {
      render(<DislikeButton pressed={pressed} />)
      const button = screen.getByRole("button", { name: "Não gostei" })
      expect(button.textContent).not.toMatch(/\d/)
      expect(button).toHaveAttribute("aria-pressed", String(pressed))
    }
  )
})
