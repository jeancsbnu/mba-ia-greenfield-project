// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { ChannelAvatar, channelAvatarSrc } from "../channel-avatar"

describe("channelAvatarSrc", () => {
  it("points at the BFF avatar route of the channel", () => {
    expect(channelAvatarSrc("joana_cria")).toBe("/api/channels/joana_cria/avatar")
  })

  it("adds the version so a new photo is not served from cache", () => {
    expect(channelAvatarSrc("joana_cria", 42)).toBe(
      "/api/channels/joana_cria/avatar?v=42"
    )
  })
})

describe("<ChannelAvatar />", () => {
  // Em jsdom a imagem nunca carrega, então o Radix mantém o fallback: é o
  // mesmo caminho do canal sem foto (404).
  it("shows the initials while the photo is not loaded", () => {
    render(<ChannelAvatar nickname="joana_cria" name="Joana Cria" />)

    expect(screen.getByText("JC")).toBeInTheDocument()
  })

  it("renders only the initials when there is no nickname", () => {
    const { container } = render(<ChannelAvatar name="Ana" />)

    expect(screen.getByText("A")).toBeInTheDocument()
    expect(container.querySelector("img")).toBeNull()
  })
})
