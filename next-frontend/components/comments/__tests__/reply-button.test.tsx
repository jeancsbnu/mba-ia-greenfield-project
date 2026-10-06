// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"

import { ReplyButton } from "../reply-button"

// "Responder" só abre e fecha o compositor; o estado aparece em aria-expanded
// e o pai é avisado pelo callback. Nenhuma requisição sai daqui.
describe("ReplyButton", () => {
  it("renders a 'Responder' button that starts collapsed", () => {
    render(<ReplyButton />)
    const button = screen.getByRole("button", { name: "Responder" })
    expect(button).toHaveAttribute("aria-expanded", "false")
  })

  it("toggles aria-expanded and notifies the parent on each click", () => {
    const onToggle = vi.fn()
    render(<ReplyButton onToggle={onToggle} />)
    const button = screen.getByRole("button", { name: "Responder" })

    fireEvent.click(button)
    expect(button).toHaveAttribute("aria-expanded", "true")
    expect(onToggle).toHaveBeenLastCalledWith(true)

    fireEvent.click(button)
    expect(button).toHaveAttribute("aria-expanded", "false")
    expect(onToggle).toHaveBeenLastCalledWith(false)
  })

  it("follows the parent's state when controlled", () => {
    const onToggle = vi.fn()
    const { rerender } = render(
      <ReplyButton expanded={false} onToggle={onToggle} />
    )
    const button = screen.getByRole("button", { name: "Responder" })

    fireEvent.click(button)
    // Controlado: o botão pede a mudança, mas só reflete o que o pai decidir.
    expect(onToggle).toHaveBeenCalledWith(true)
    expect(button).toHaveAttribute("aria-expanded", "false")

    rerender(<ReplyButton expanded onToggle={onToggle} />)
    expect(button).toHaveAttribute("aria-expanded", "true")
  })

  it("points aria-controls at the composer it opens", () => {
    render(<ReplyButton controls="reply-composer-1" />)
    expect(screen.getByRole("button", { name: "Responder" })).toHaveAttribute(
      "aria-controls",
      "reply-composer-1"
    )
  })

  it("does not issue any network request", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch")
    render(<ReplyButton />)
    fireEvent.click(screen.getByRole("button", { name: "Responder" }))
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })
})
