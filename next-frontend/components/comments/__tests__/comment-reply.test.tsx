// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"

import { CommentReply } from "../comment-reply"

const ONE_DAY_AGO = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

// A resposta tem a mesma estrutura do comentário-raiz, com avatar menor.
describe("CommentReply", () => {
  it("renders author, body and relative time like a root comment", () => {
    render(
      <CommentReply
        authorName="Ana Costa"
        createdAt={ONE_DAY_AGO}
        body="Concordo"
      />
    )
    expect(screen.getByText("Ana Costa")).toBeInTheDocument()
    expect(screen.getByText("Concordo")).toBeInTheDocument()
    expect(screen.getByText("ontem")).toBeInTheDocument()
  })

  it("marks itself as a reply and uses the small avatar", () => {
    const { container } = render(
      <CommentReply
        authorName="Ana Costa"
        createdAt={ONE_DAY_AGO}
        body="Concordo"
      />
    )
    expect(
      container.querySelector("[data-slot='comment-reply']")
    ).not.toBeNull()
    expect(container.querySelector("[data-slot='avatar']")).toHaveAttribute(
      "data-size",
      "sm"
    )
  })

  it("renders the same actions slot as a root comment", () => {
    render(
      <CommentReply
        authorName="Ana Costa"
        createdAt={ONE_DAY_AGO}
        body="Concordo"
        actions={<button type="button">Responder</button>}
      />
    )
    expect(
      screen.getByRole("button", { name: "Responder" })
    ).toBeInTheDocument()
  })
})
