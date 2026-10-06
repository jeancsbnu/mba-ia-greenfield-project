// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { describe, expect, it, vi } from "vitest"

import { buildComment } from "@/mocks/factories/comments"
import { server } from "@/mocks/server"

import { RepliesLoadMore } from "../replies-load-more"

describe("RepliesLoadMore", () => {
  it("shows how many replies remain and asks from offset = loaded", async () => {
    let seenUrl = ""
    const rest = [1, 2, 3, 4].map((i) =>
      buildComment({ id: `r-${i}`, parentId: "c-1" })
    )
    server.use(
      http.get("/api/comments/c-1/replies", ({ request }) => {
        seenUrl = request.url
        return HttpResponse.json({ items: rest, total: 7, offset: 3, limit: 4 })
      })
    )
    const onLoaded = vi.fn()
    const user = userEvent.setup()
    render(
      <RepliesLoadMore
        commentId="c-1"
        loaded={3}
        total={7}
        onLoaded={onLoaded}
      />
    )

    await user.click(
      screen.getByRole("button", { name: "Ver mais 4 respostas" })
    )

    await waitFor(() => expect(onLoaded).toHaveBeenCalledWith(rest))
    expect(new URL(seenUrl).searchParams.get("offset")).toBe("3")
    expect(new URL(seenUrl).searchParams.get("limit")).toBe("4")
  })

  it("uses the singular for a single remaining reply", () => {
    render(
      <RepliesLoadMore
        commentId="c-1"
        loaded={3}
        total={4}
        onLoaded={vi.fn()}
      />
    )
    expect(
      screen.getByRole("button", { name: "Ver mais 1 resposta" })
    ).toBeInTheDocument()
  })

  it("renders nothing when the thread is complete", () => {
    const { container } = render(
      <RepliesLoadMore
        commentId="c-1"
        loaded={7}
        total={7}
        onLoaded={vi.fn()}
      />
    )
    expect(container).toBeEmptyDOMElement()
  })
})
