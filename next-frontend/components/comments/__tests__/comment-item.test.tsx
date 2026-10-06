// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"

import { CommentItem } from "../comment-item"

const TWO_HOURS_AGO = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()

// O comentário-raiz exibe autor, timestamp relativo, corpo e a linha de ações
// que recebe pronta — não faz I/O nenhum.
describe("CommentItem", () => {
  it("renders the author name and the comment body", () => {
    render(
      <CommentItem
        authorName="Maria Rocha"
        createdAt={TWO_HOURS_AGO}
        body="Ótimo vídeo"
      />
    )
    expect(screen.getByText("Maria Rocha")).toBeInTheDocument()
    expect(screen.getByText("Ótimo vídeo")).toBeInTheDocument()
  })

  it("shows the relative time with the exact date in a time element", () => {
    render(
      <CommentItem
        authorName="Maria Rocha"
        createdAt={TWO_HOURS_AGO}
        body="Ótimo vídeo"
      />
    )
    const time = screen.getByText("há 2 horas")
    expect(time.tagName).toBe("TIME")
    expect(time).toHaveAttribute("dateTime", TWO_HOURS_AGO)
    expect(time).toHaveAttribute("title")
  })

  it("renders the author's initials in the avatar", () => {
    render(
      <CommentItem
        authorName="Maria Rocha"
        createdAt={TWO_HOURS_AGO}
        body="Ótimo vídeo"
      />
    )
    expect(screen.getByText("MR")).toBeInTheDocument()
  })

  it("renders the actions slot when provided", () => {
    render(
      <CommentItem
        authorName="Maria Rocha"
        createdAt={TWO_HOURS_AGO}
        body="Ótimo vídeo"
        actions={<button type="button">Responder</button>}
      />
    )
    expect(
      screen.getByRole("button", { name: "Responder" })
    ).toBeInTheDocument()
  })

  it("omits the actions row when no actions are given", () => {
    const { container } = render(
      <CommentItem
        authorName="Maria Rocha"
        createdAt={TWO_HOURS_AGO}
        body="Ótimo vídeo"
      />
    )
    expect(container.querySelector("[data-slot='comment-actions']")).toBeNull()
  })
})
