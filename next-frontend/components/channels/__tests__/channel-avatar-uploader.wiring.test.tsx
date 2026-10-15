// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { server } from "@/mocks/server"
import { ChannelAvatarUploader } from "../channel-avatar-uploader"

const { refreshMock } = vi.hoisted(() => ({ refreshMock: vi.fn() }))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}))

beforeEach(() => {
  refreshMock.mockClear()
})

function png(size = 10) {
  return new File([new Uint8Array(size)], "foto.png", { type: "image/png" })
}

describe("<ChannelAvatarUploader /> wiring", () => {
  it("uploads the chosen image and refreshes the chrome", async () => {
    const user = userEvent.setup()
    const received: (File | null)[] = []
    server.use(
      http.put("/api/me/channel/avatar", async ({ request }) => {
        received.push((await request.formData()).get("avatar") as File | null)
        return new HttpResponse(null, { status: 204 })
      })
    )

    render(<ChannelAvatarUploader nickname="joana_cria" name="Joana Cria" />)
    await user.upload(screen.getByLabelText("Arquivo da foto do canal"), png())

    await waitFor(() => expect(refreshMock).toHaveBeenCalledTimes(1))
    expect(received).toHaveLength(1)
    expect(received[0]?.type).toBe("image/png")
  })

  it("removes the photo with DELETE", async () => {
    const user = userEvent.setup()
    let deleted = 0
    server.use(
      http.delete("/api/me/channel/avatar", () => {
        deleted += 1
        return new HttpResponse(null, { status: 204 })
      })
    )

    render(<ChannelAvatarUploader nickname="joana_cria" name="Joana Cria" />)
    await user.click(screen.getByRole("button", { name: "Remover foto" }))

    await waitFor(() => expect(deleted).toBe(1))
    expect(refreshMock).toHaveBeenCalledTimes(1)
  })

  it("refuses an oversized file without calling the API", async () => {
    const user = userEvent.setup()
    let calls = 0
    server.use(
      http.put("/api/me/channel/avatar", () => {
        calls += 1
        return new HttpResponse(null, { status: 204 })
      })
    )

    render(<ChannelAvatarUploader nickname="joana_cria" name="Joana Cria" />)
    await user.upload(
      screen.getByLabelText("Arquivo da foto do canal"),
      png(2 * 1024 * 1024 + 1)
    )

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "JPEG, PNG ou WebP de até 2 MB"
    )
    expect(calls).toBe(0)
  })

  it("shows the server rejection inline", async () => {
    const user = userEvent.setup()
    server.use(
      http.put("/api/me/channel/avatar", () =>
        HttpResponse.json(
          { statusCode: 400, error: "VALIDATION_FAILED", message: "bad", code: null },
          { status: 400 }
        )
      )
    )

    render(<ChannelAvatarUploader nickname="joana_cria" name="Joana Cria" />)
    await user.upload(screen.getByLabelText("Arquivo da foto do canal"), png())

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "JPEG, PNG ou WebP de até 2 MB"
    )
    expect(refreshMock).not.toHaveBeenCalled()
  })
})
