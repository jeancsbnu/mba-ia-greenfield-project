// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { Comment } from "@/lib/api/contracts"
import type { MutationOutcome } from "@/lib/social/mutation"

import { NewCommentForm } from "../new-comment-form"

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => "/videos/abc123",
}))

const created: Comment = {
  id: "c-new",
  parentId: null,
  body: "Oi",
  createdAt: "2026-10-05T12:00:00.000Z",
  likesCount: 0,
  viewerReaction: null,
  author: { name: "Joana Cria", nickname: "joana_cria" },
}

beforeEach(() => {
  pushMock.mockClear()
})

describe("<NewCommentForm /> wiring", () => {
  it("submits the trimmed body and clears the field on success", async () => {
    const onSubmit = vi.fn(async (): Promise<MutationOutcome<Comment>> => ({
      ok: true,
      data: created,
    }))
    const user = userEvent.setup()
    render(<NewCommentForm onSubmit={onSubmit} isAuthenticated />)

    await user.type(screen.getByLabelText("Seu comentário"), "  Oi  ")
    await user.click(screen.getByRole("button", { name: "Comentar" }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith("Oi"))
    await waitFor(() =>
      expect(screen.getByLabelText("Seu comentário")).toHaveValue("")
    )
  })

  it("keeps the submit disabled for a blank body, without any request", async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<NewCommentForm onSubmit={onSubmit} isAuthenticated />)

    await user.type(screen.getByLabelText("Seu comentário"), "    ")

    expect(screen.getByRole("button", { name: "Comentar" })).toBeDisabled()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("shows VALIDATION_ERROR inline below the field", async () => {
    const onSubmit = vi.fn(async (): Promise<MutationOutcome<Comment>> => ({
      ok: false,
      status: 400,
      error: "VALIDATION_ERROR",
    }))
    const user = userEvent.setup()
    render(<NewCommentForm onSubmit={onSubmit} isAuthenticated />)

    await user.type(screen.getByLabelText("Seu comentário"), "Oi")
    await user.click(screen.getByRole("button", { name: "Comentar" }))

    expect(
      await screen.findByText("Revise o texto do comentário")
    ).toBeInTheDocument()
    expect(screen.getByLabelText("Seu comentário")).toHaveAttribute(
      "aria-invalid",
      "true"
    )
  })

  it("uses the reply labels in reply mode", () => {
    render(<NewCommentForm onSubmit={vi.fn()} isAuthenticated mode="reply" />)
    expect(screen.getByLabelText("Sua resposta")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Responder" })
    ).toBeInTheDocument()
  })

  it("sends the anonymous visitor to the login on focus", async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<NewCommentForm onSubmit={onSubmit} isAuthenticated={false} />)

    await user.click(screen.getByLabelText("Seu comentário"))

    expect(pushMock).toHaveBeenCalledWith("/login?returnTo=%2Fvideos%2Fabc123")
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
