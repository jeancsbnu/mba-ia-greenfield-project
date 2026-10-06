// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { server } from "@/mocks/server"

import { CommentReactions } from "../comment-reactions"

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => "/videos/abc123",
}))

const ENDPOINT = "/api/comments/c-1/reaction"

beforeEach(() => {
  pushMock.mockClear()
})

function renderReactions(initialReaction: "like" | "dislike" | null = null) {
  return render(
    <CommentReactions
      commentId="c-1"
      initialReaction={initialReaction}
      initialLikesCount={14}
      isAuthenticated
    />
  )
}

describe("<CommentReactions /> wiring", () => {
  it("likes a comment through the comment reaction route", async () => {
    server.use(
      http.put(ENDPOINT, () =>
        HttpResponse.json({ viewerReaction: "like", likesCount: 15 })
      )
    )
    const user = userEvent.setup()
    renderReactions()

    await user.click(screen.getByRole("button", { name: "Gostei · 14" }))

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Gostei · 15" })
      ).toHaveAttribute("aria-pressed", "true")
    )
  })

  it("keeps like and dislike mutually exclusive", async () => {
    server.use(
      http.put(ENDPOINT, () =>
        HttpResponse.json({ viewerReaction: "dislike", likesCount: 13 })
      )
    )
    const user = userEvent.setup()
    renderReactions("like")

    await user.click(screen.getByRole("button", { name: "Não gostei" }))

    expect(screen.getByRole("button", { name: "Não gostei" })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
    expect(screen.getByRole("button", { name: "Gostei · 13" })).toHaveAttribute(
      "aria-pressed",
      "false"
    )
  })

  it("rolls back on error", async () => {
    server.use(
      http.put(ENDPOINT, () =>
        HttpResponse.json(
          {
            statusCode: 404,
            error: "COMMENT_NOT_FOUND",
            message: "x",
            code: null,
          },
          { status: 404 }
        )
      )
    )
    const user = userEvent.setup()
    const { container } = renderReactions()

    await user.click(screen.getByRole("button", { name: "Gostei · 14" }))

    await waitFor(() =>
      expect(
        container.querySelector("[data-slot='comment-reaction-error']")
      ).toHaveTextContent(/não está mais disponível/)
    )
    expect(screen.getByRole("button", { name: "Gostei · 14" })).toHaveAttribute(
      "aria-pressed",
      "false"
    )
  })
})
