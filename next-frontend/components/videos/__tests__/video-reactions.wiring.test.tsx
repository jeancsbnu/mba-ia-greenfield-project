// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { server } from "@/mocks/server"

import { VideoReactions } from "../video-reactions"

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => "/videos/abc123",
}))

const ENDPOINT = "/api/videos/abc123/reaction"

beforeEach(() => {
  pushMock.mockClear()
})

type Props = React.ComponentProps<typeof VideoReactions>

function renderReactions(props: Partial<Props> = {}) {
  return render(
    <VideoReactions
      publicId="abc123"
      initialReaction={null}
      initialLikesCount={128}
      isAuthenticated
      {...props}
    />
  )
}

describe("<VideoReactions /> wiring", () => {
  it("sends PUT like and keeps the like pressed with the new count", async () => {
    const bodies: unknown[] = []
    server.use(
      http.put(ENDPOINT, async ({ request }) => {
        bodies.push(await request.json())
        return HttpResponse.json({ viewerReaction: "like", likesCount: 129 })
      })
    )
    const user = userEvent.setup()
    renderReactions()

    await user.click(screen.getByRole("button", { name: "Gostei · 128" }))

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Gostei · 129" })).toHaveAttribute(
        "aria-pressed",
        "true"
      )
    )
    expect(bodies).toEqual([{ type: "like" }])
  })

  it("switches like to dislike on screen, lowering the count", async () => {
    server.use(
      http.put(ENDPOINT, () =>
        HttpResponse.json({ viewerReaction: "dislike", likesCount: 127 })
      )
    )
    const user = userEvent.setup()
    renderReactions({ initialReaction: "like" })

    await user.click(screen.getByRole("button", { name: "Não gostei" }))

    expect(screen.getByRole("button", { name: "Não gostei" })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
    expect(screen.getByRole("button", { name: "Gostei · 127" })).toHaveAttribute(
      "aria-pressed",
      "false"
    )
  })

  it("rolls back and shows a message near the control on error", async () => {
    server.use(
      http.put(ENDPOINT, () =>
        HttpResponse.json(
          { statusCode: 429, error: "RATE_LIMIT_EXCEEDED", message: "x", code: null },
          { status: 429 }
        )
      )
    )
    const user = userEvent.setup()
    const { container } = renderReactions()

    await user.click(screen.getByRole("button", { name: "Gostei · 128" }))

    await waitFor(() =>
      expect(
        container.querySelector("[data-slot='reaction-error']")
      ).toHaveTextContent(/Muitas reações/)
    )
    expect(screen.getByRole("button", { name: "Gostei · 128" })).toHaveAttribute(
      "aria-pressed",
      "false"
    )
  })

  it("sends the anonymous visitor to the login", async () => {
    const user = userEvent.setup()
    renderReactions({ isAuthenticated: false })

    await user.click(screen.getByRole("button", { name: "Gostei · 128" }))

    expect(pushMock).toHaveBeenCalledWith("/login?returnTo=%2Fvideos%2Fabc123")
  })
})
