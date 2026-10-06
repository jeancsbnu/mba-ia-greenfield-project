// @vitest-environment jsdom
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { delay, http, HttpResponse } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { buildCommentThread } from "@/mocks/factories/comments"
import { server } from "@/mocks/server"

import { CommentsSection } from "../comments-section"

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => "/videos/abc123",
}))

const COMMENTS = "/api/videos/abc123/comments"

beforeEach(() => {
  pushMock.mockClear()
})

function page(threads = [buildCommentThread({ id: "c-1", body: "Primeiro" })]) {
  return { items: threads, total: threads.length, offset: 0, limit: 10 }
}

describe("CommentsSection", () => {
  it("renders the heading with the count and the sort label", () => {
    render(
      <CommentsSection
        publicId="abc123"
        initialPage={page()}
        commentsCount={12}
        isAuthenticated
      />
    )
    expect(
      screen.getByRole("heading", { level: 2, name: "12 comentários" })
    ).toBeInTheDocument()
    expect(screen.getByText("Mais recentes primeiro")).toBeInTheDocument()
  })

  it("shows the empty state for a video without comments", () => {
    const { container } = render(
      <CommentsSection
        publicId="abc123"
        initialPage={page([])}
        commentsCount={0}
        isAuthenticated
      />
    )
    expect(
      screen.getByRole("heading", { level: 2, name: "0 comentários" })
    ).toBeInTheDocument()
    expect(
      container.querySelector("[data-slot='comments-empty']")
    ).not.toBeNull()
    expect(screen.getByLabelText("Seu comentário")).toBeInTheDocument()
  })

  it("shows the error state when the first page failed, keeping the composer", () => {
    const { container } = render(
      <CommentsSection
        publicId="abc123"
        initialPage={null}
        commentsCount={3}
        isAuthenticated
      />
    )
    expect(
      container.querySelector("[data-slot='comments-error']")
    ).not.toBeNull()
    expect(screen.getByLabelText("Seu comentário")).toBeInTheDocument()
  })

  it("puts a pending item on top, then replaces it with the created comment", async () => {
    server.use(
      http.post(COMMENTS, async () => {
        await delay(80)
        return HttpResponse.json(
          {
            id: "c-new",
            parentId: null,
            body: "Ótimo vídeo",
            createdAt: new Date().toISOString(),
            likesCount: 0,
            viewerReaction: null,
            author: { name: "Joana Cria", nickname: "joana_cria" },
          },
          { status: 201 }
        )
      })
    )
    const user = userEvent.setup()
    render(
      <CommentsSection
        publicId="abc123"
        initialPage={page()}
        commentsCount={1}
        isAuthenticated
        viewerName="Joana Cria"
      />
    )

    await user.type(screen.getByLabelText("Seu comentário"), "Ótimo vídeo")
    await user.click(screen.getByRole("button", { name: "Comentar" }))

    const items = within(screen.getByRole("list")).getAllByRole("listitem")
    expect(items[0]).toHaveTextContent("Ótimo vídeo")
    expect(items[0]).toHaveTextContent("Enviando…")

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { level: 2, name: "2 comentários" })
      ).toBeInTheDocument()
    )
    const after = within(screen.getByRole("list")).getAllByRole("listitem")
    expect(after[0]).toHaveTextContent("Ótimo vídeo")
    expect(after[0]).not.toHaveTextContent("Enviando…")
    expect(screen.getByLabelText("Seu comentário")).toHaveValue("")
  })
})
