// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  ChannelSubscriptionProvider,
  ProvidedSubscriberCount,
} from "@/components/channels/channel-subscription-provider"
import { server } from "@/mocks/server"

import { SubscriptionButton } from "../subscription-button"

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => "/channel/subscriptions",
}))

const ENDPOINT = "/api/channels/maria_rocha/subscription"

beforeEach(() => {
  pushMock.mockClear()
})

function renderRow() {
  return render(
    <ChannelSubscriptionProvider
      nickname="maria_rocha"
      initialSubscribed
      initialSubscribersCount={1200}
      isAuthenticated
    >
      <ProvidedSubscriberCount />
      <SubscriptionButton />
    </ChannelSubscriptionProvider>
  )
}

describe("<SubscriptionButton /> wiring", () => {
  it("unsubscribes with DELETE on the first click, then resubscribes with PUT", async () => {
    const methods: string[] = []
    server.use(
      http.delete(ENDPOINT, () => {
        methods.push("DELETE")
        return HttpResponse.json({ subscribed: false, subscribersCount: 1199 })
      }),
      http.put(ENDPOINT, () => {
        methods.push("PUT")
        return HttpResponse.json({ subscribed: true, subscribersCount: 1200 })
      })
    )
    const user = userEvent.setup()
    renderRow()

    await user.click(screen.getByRole("button", { name: "Inscrito" }))
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Inscrever-se" })
      ).toHaveAttribute("aria-pressed", "false")
    )
    expect(screen.getByText("1,2 mil inscritos")).toBeInTheDocument()
    expect(methods).toEqual(["DELETE"])

    await user.click(screen.getByRole("button", { name: "Inscrever-se" }))
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Inscrito" })).toHaveAttribute(
        "aria-pressed",
        "true"
      )
    )
    expect(methods).toEqual(["DELETE", "PUT"])
  })

  it("reverts and shows the row error on RATE_LIMIT_EXCEEDED", async () => {
    server.use(
      http.delete(ENDPOINT, () =>
        HttpResponse.json(
          {
            statusCode: 429,
            error: "RATE_LIMIT_EXCEEDED",
            message: "x",
            code: null,
          },
          { status: 429 }
        )
      )
    )
    const user = userEvent.setup()
    const { container } = renderRow()

    await user.click(screen.getByRole("button", { name: "Inscrito" }))

    await waitFor(() =>
      expect(
        container.querySelector("[data-slot='subscription-error']")
      ).toHaveTextContent("Muitas ações em pouco tempo")
    )
    expect(screen.getByRole("button", { name: "Inscrito" })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
  })

  it("sends the user to the login with returnTo on UNAUTHORIZED", async () => {
    server.use(
      http.delete(ENDPOINT, () =>
        HttpResponse.json(
          { statusCode: 401, error: "UNAUTHORIZED", message: "x", code: null },
          { status: 401 }
        )
      )
    )
    const user = userEvent.setup()
    renderRow()

    await user.click(screen.getByRole("button", { name: "Inscrito" }))

    await waitFor(() =>
      expect(pushMock).toHaveBeenCalledWith(
        "/login?returnTo=%2Fchannel%2Fsubscriptions"
      )
    )
  })
})
