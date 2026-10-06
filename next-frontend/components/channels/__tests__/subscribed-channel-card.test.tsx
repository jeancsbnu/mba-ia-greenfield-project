// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { SubscribedChannelCard } from "../subscribed-channel-card"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/channel/subscriptions",
}))

function renderCard(videosCount = 42) {
  return render(
    <ul>
      <SubscribedChannelCard
        channel={{
          name: "Maria Rocha",
          nickname: "maria_rocha",
          subscribersCount: 1200,
          videosCount,
        }}
      />
    </ul>
  )
}

describe("SubscribedChannelCard", () => {
  it("shows 'N inscritos · N vídeos' and the subscribed toggle", () => {
    renderCard()
    expect(screen.getByText("1,2 mil inscritos")).toBeInTheDocument()
    expect(screen.getByRole("listitem")).toHaveTextContent(
      "1,2 mil inscritos · 42 vídeos"
    )
    expect(screen.getByRole("button", { name: "Inscrito" })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
  })

  it("links the channel name to the public channel page", () => {
    renderCard()
    expect(screen.getByRole("link", { name: "Maria Rocha" })).toHaveAttribute(
      "href",
      "/@maria_rocha"
    )
  })

  it("uses the singular for a single video", () => {
    renderCard(1)
    expect(screen.getByRole("listitem")).toHaveTextContent("· 1 vídeo")
  })
})
