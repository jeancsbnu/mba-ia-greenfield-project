// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ChannelSubscriptionProvider } from "@/components/channels/channel-subscription-provider"
import { server } from "@/mocks/server"

import { SubscribeButton } from "../subscribe-button"

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => "/videos/abc123",
}))

const ENDPOINT = "/api/channels/maria_rocha/subscription"

beforeEach(() => {
  pushMock.mockClear()
})

function renderButton(subscribed = false) {
  return render(
    <ChannelSubscriptionProvider
      nickname="maria_rocha"
      initialSubscribed={subscribed}
      initialSubscribersCount={1200}
      isAuthenticated
    >
      <SubscribeButton />
    </ChannelSubscriptionProvider>
  )
}

describe("<SubscribeButton /> wiring", () => {
  it("toggles between 'Inscrever-se' and 'Inscrito'", async () => {
    server.use(
      http.put(ENDPOINT, () =>
        HttpResponse.json({ subscribed: true, subscribersCount: 1201 })
      )
    )
    const user = userEvent.setup()
    renderButton()

    await user.click(screen.getByRole("button", { name: "Inscrever-se" }))

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Inscrito" })).toHaveAttribute(
        "aria-pressed",
        "true"
      )
    )
  })

  it("sends the visitor to the login with returnTo when the session expired", async () => {
    server.use(
      http.put(ENDPOINT, () =>
        HttpResponse.json(
          { statusCode: 401, error: "UNAUTHORIZED", message: "x", code: null },
          { status: 401 }
        )
      )
    )
    const user = userEvent.setup()
    renderButton()

    await user.click(screen.getByRole("button", { name: "Inscrever-se" }))

    await waitFor(() =>
      expect(pushMock).toHaveBeenCalledWith("/login?returnTo=%2Fvideos%2Fabc123")
    )
  })

  it("reverts on 429 and shows a message near the button", async () => {
    server.use(
      http.delete(ENDPOINT, () =>
        HttpResponse.json(
          { statusCode: 429, error: "RATE_LIMIT_EXCEEDED", message: "x", code: null },
          { status: 429 }
        )
      )
    )
    const user = userEvent.setup()
    const { container } = renderButton(true)

    await user.click(screen.getByRole("button", { name: "Inscrito" }))

    await waitFor(() =>
      expect(
        container.querySelector("[data-slot='subscription-error']")
      ).toHaveTextContent(/Muitas ações/)
    )
    expect(screen.getByRole("button", { name: "Inscrito" })).toBeInTheDocument()
  })
})
