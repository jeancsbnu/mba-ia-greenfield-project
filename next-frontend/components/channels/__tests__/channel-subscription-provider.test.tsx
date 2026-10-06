// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { delay, http, HttpResponse } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  ChannelSubscriptionProvider,
  ProvidedSubscriberCount,
  useChannelSubscription,
} from "@/components/channels/channel-subscription-provider"
import { server } from "@/mocks/server"

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => "/@joana_cria",
}))

const ENDPOINT = "/api/channels/joana_cria/subscription"

function ToggleProbe() {
  const { subscribed, toggle, errorCode } = useChannelSubscription()
  return (
    <>
      <button type="button" aria-pressed={subscribed} onClick={toggle}>
        {subscribed ? "Inscrito" : "Inscrever-se"}
      </button>
      {errorCode ? <p data-slot="probe-error">{errorCode}</p> : null}
    </>
  )
}

function renderProvider({
  subscribed = false,
  count = 41,
  isAuthenticated = true,
} = {}) {
  return render(
    <ChannelSubscriptionProvider
      nickname="joana_cria"
      initialSubscribed={subscribed}
      initialSubscribersCount={count}
      isAuthenticated={isAuthenticated}
    >
      <ProvidedSubscriberCount />
      <ToggleProbe />
    </ChannelSubscriptionProvider>
  )
}

beforeEach(() => {
  pushMock.mockClear()
})

describe("ChannelSubscriptionProvider", () => {
  it("updates the button and the count in the same render, before the API answers", async () => {
    server.use(
      http.put(ENDPOINT, async () => {
        await delay(100)
        return HttpResponse.json({ subscribed: true, subscribersCount: 42 })
      })
    )
    const user = userEvent.setup()
    renderProvider()

    await user.click(screen.getByRole("button", { name: "Inscrever-se" }))

    expect(screen.getByRole("button", { name: "Inscrito" })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
    expect(screen.getByText("42 inscritos")).toBeInTheDocument()
  })

  it("reconciles with the subscribersCount returned by the API", async () => {
    server.use(
      http.put(ENDPOINT, () =>
        HttpResponse.json({ subscribed: true, subscribersCount: 1200 })
      )
    )
    const user = userEvent.setup()
    renderProvider()

    await user.click(screen.getByRole("button", { name: "Inscrever-se" }))

    await waitFor(() =>
      expect(screen.getByText(/^1,2\smil inscritos$/)).toBeInTheDocument()
    )
  })

  it("unsubscribes with DELETE when already subscribed", async () => {
    const methods: string[] = []
    server.use(
      http.delete(ENDPOINT, ({ request }) => {
        methods.push(request.method)
        return HttpResponse.json({ subscribed: false, subscribersCount: 40 })
      })
    )
    const user = userEvent.setup()
    renderProvider({ subscribed: true })

    await user.click(screen.getByRole("button", { name: "Inscrito" }))

    await waitFor(() => expect(screen.getByText("40 inscritos")).toBeInTheDocument())
    expect(methods).toEqual(["DELETE"])
  })

  it("rolls back when the mutation fails", async () => {
    server.use(
      http.put(ENDPOINT, () =>
        HttpResponse.json(
          { statusCode: 429, error: "RATE_LIMIT_EXCEEDED", message: "x", code: null },
          { status: 429 }
        )
      )
    )
    const user = userEvent.setup()
    const { container } = renderProvider()

    await user.click(screen.getByRole("button", { name: "Inscrever-se" }))

    await waitFor(() =>
      expect(container.querySelector("[data-slot='probe-error']")).toHaveTextContent(
        "RATE_LIMIT_EXCEEDED"
      )
    )
    expect(screen.getByRole("button", { name: "Inscrever-se" })).toBeInTheDocument()
    expect(screen.getByText("41 inscritos")).toBeInTheDocument()
  })

  it("sends the anonymous visitor to the login without calling the API", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch")
    const user = userEvent.setup()
    renderProvider({ isAuthenticated: false })

    await user.click(screen.getByRole("button", { name: "Inscrever-se" }))

    expect(pushMock).toHaveBeenCalledWith("/login?returnTo=%2F%40joana_cria")
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })
})
