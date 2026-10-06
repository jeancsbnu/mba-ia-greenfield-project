// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"

import { CommentThread } from "../comment-thread"

// A thread agrupa a raiz e, só quando há respostas, a lista delas
// (profundidade 1, social-interactions/TD-04).
describe("CommentThread", () => {
  it("renders the root comment", () => {
    render(<CommentThread root={<p>Comentário raiz</p>} />)
    expect(screen.getByText("Comentário raiz")).toBeInTheDocument()
  })

  it("renders no reply list when the thread has no replies", () => {
    render(<CommentThread root={<p>Comentário raiz</p>} />)
    expect(screen.queryByRole("list")).toBeNull()
  })

  it("renders the replies after the root when provided", () => {
    render(
      <CommentThread
        root={<p>Comentário raiz</p>}
        replies={
          <ul>
            <li>Resposta</li>
          </ul>
        }
      />
    )
    const root = screen.getByText("Comentário raiz")
    const list = screen.getByRole("list")
    expect(
      root.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })

  it("renders the reply composer slot when open", () => {
    render(
      <CommentThread
        root={<p>Comentário raiz</p>}
        composer={<textarea aria-label="Sua resposta" />}
      />
    )
    expect(screen.getByLabelText("Sua resposta")).toBeInTheDocument()
  })
})
