// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react"
import { describe, it, expect } from "vitest"

import { ReplyList } from "../reply-list"

// A lista de respostas renderiza o que recebe, na ordem recebida, e o
// "ver mais" depois das respostas.
describe("ReplyList", () => {
  it("renders the replies in the order received, without reordering", () => {
    render(
      <ReplyList>
        <p>Resposta mais recente</p>
        <p>Resposta do meio</p>
        <p>Resposta mais antiga</p>
      </ReplyList>
    )
    const items = within(screen.getByRole("list")).getAllByRole("listitem")
    expect(items.map((item) => item.textContent)).toEqual([
      "Resposta mais recente",
      "Resposta do meio",
      "Resposta mais antiga",
    ])
  })

  it("renders the load-more slot after the replies", () => {
    render(
      <ReplyList loadMore={<button type="button">Ver mais 4 respostas</button>}>
        <p>Resposta</p>
      </ReplyList>
    )
    const list = screen.getByRole("list")
    const button = screen.getByRole("button", { name: "Ver mais 4 respostas" })
    expect(list.contains(button)).toBe(false)
    expect(
      list.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })

  it("omits the load-more control when there is nothing left to load", () => {
    render(
      <ReplyList>
        <p>Resposta</p>
      </ReplyList>
    )
    expect(screen.queryByRole("button")).toBeNull()
  })
})
