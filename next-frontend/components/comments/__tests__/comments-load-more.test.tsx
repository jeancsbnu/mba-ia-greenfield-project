// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { describe, expect, it, vi } from "vitest"

import { buildCommentThread } from "@/mocks/factories/comments"
import { server } from "@/mocks/server"

import { CommentsLoadMore } from "../comments-load-more"

describe("CommentsLoadMore", () => {
  it("fetches the next page from offset = loaded and hands it over", async () => {
    let seenUrl = ""
    const next = [
      buildCommentThread({ id: "c-11" }),
      buildCommentThread({ id: "c-12" }),
    ]
    server.use(
      http.get("/api/videos/abc123/comments", ({ request }) => {
        seenUrl = request.url
        return HttpResponse.json({
          items: next,
          total: 12,
          offset: 10,
          limit: 10,
        })
      })
    )
    const onLoaded = vi.fn()
    const user = userEvent.setup()
    render(
      <CommentsLoadMore
        publicId="abc123"
        loaded={10}
        total={12}
        onLoaded={onLoaded}
      />
    )

    await user.click(
      screen.getByRole("button", { name: "Carregar mais comentários" })
    )

    await waitFor(() => expect(onLoaded).toHaveBeenCalledWith(next))
    expect(new URL(seenUrl).searchParams.get("offset")).toBe("10")
    expect(new URL(seenUrl).searchParams.get("limit")).toBe("10")
  })

  it("renders nothing once every root is loaded", () => {
    const { container } = render(
      <CommentsLoadMore
        publicId="abc123"
        loaded={12}
        total={12}
        onLoaded={vi.fn()}
      />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it("shows an error when the page cannot be loaded", async () => {
    server.use(
      http.get("/api/videos/abc123/comments", () =>
        HttpResponse.json({}, { status: 500 })
      )
    )
    const user = userEvent.setup()
    render(
      <CommentsLoadMore
        publicId="abc123"
        loaded={10}
        total={12}
        onLoaded={vi.fn()}
      />
    )

    await user.click(
      screen.getByRole("button", { name: "Carregar mais comentários" })
    )

    expect(
      await screen.findByText("Não foi possível carregar mais comentários.")
    ).toBeInTheDocument()
  })
})
