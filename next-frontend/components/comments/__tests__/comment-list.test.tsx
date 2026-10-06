// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react"
import { describe, it, expect } from "vitest"

import { CommentList } from "../comment-list"

// A lista renderiza as threads na ordem recebida, uma por item, sem buscar
// nada nem reordenar.
describe("CommentList", () => {
  it("renders one list item per thread, in the order received", () => {
    render(
      <CommentList>
        <p>Thread mais recente</p>
        <p>Thread anterior</p>
      </CommentList>
    )
    const items = within(screen.getByRole("list")).getAllByRole("listitem")
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveTextContent("Thread mais recente")
    expect(items[1]).toHaveTextContent("Thread anterior")
  })

  it("skips empty children instead of rendering blank items", () => {
    render(
      <CommentList>
        <p>Única thread</p>
        {null}
        {false}
      </CommentList>
    )
    expect(screen.getAllByRole("listitem")).toHaveLength(1)
  })

  it("renders an empty list when there are no threads", () => {
    render(<CommentList />)
    expect(screen.getByRole("list")).toBeInTheDocument()
    expect(screen.queryAllByRole("listitem")).toHaveLength(0)
  })
})
