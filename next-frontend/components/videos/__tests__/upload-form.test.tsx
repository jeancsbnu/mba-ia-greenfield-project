// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { server } from "@/mocks/server"

interface MockUploadOptions {
  onProgress?: (bytesSent: number, bytesTotal: number) => void
  onSuccess?: () => void
  onError?: (error: Error) => void
}

const uploadInstances: {
  options: MockUploadOptions
  url: string | null
  start: () => void
}[] = []

vi.mock("tus-js-client", () => {
  class MockUpload {
    options: MockUploadOptions
    url: string | null = "http://localhost/api/videos/upload/fixture-upload-id"

    constructor(_file: File, options: MockUploadOptions) {
      this.options = options
      uploadInstances.push(this)
    }

    start() {
      // no-op — the test drives callbacks manually
    }
  }
  return { Upload: MockUpload }
})

import { UploadForm } from "@/components/videos/upload-form"

function makeVideoFile() {
  return new File(["fake video bytes"], "video.mp4", { type: "video/mp4" })
}

describe("<UploadForm />", () => {
  beforeEach(() => {
    uploadInstances.length = 0
  })

  it("disables the submit button until a file is selected", () => {
    render(<UploadForm />)
    expect(
      screen.getByRole("button", { name: "Enviar vídeo" })
    ).toBeDisabled()
  })

  it("starts a tus upload and shows the progress bar advancing", async () => {
    const user = userEvent.setup()
    render(<UploadForm />)

    await user.upload(screen.getByLabelText("Arquivo de vídeo"), makeVideoFile())
    await user.click(screen.getByRole("button", { name: "Enviar vídeo" }))

    expect(uploadInstances).toHaveLength(1)
    uploadInstances[0].options.onProgress?.(50, 100)

    await waitFor(() => {
      expect(screen.getByText("50% enviado")).toBeInTheDocument()
    })
  })

  it("polls video status after upload completes, until it leaves processing", async () => {
    let callCount = 0
    server.use(
      http.get("/api/videos/:publicId", () => {
        callCount += 1
        return HttpResponse.json({
          publicId: "fixture-upload-id",
          title: "My Video",
          description: null,
          status: callCount < 2 ? "processing" : "ready",
          durationSeconds: callCount < 2 ? null : 12,
          createdAt: new Date().toISOString(),
        })
      })
    )

    const user = userEvent.setup()
    render(<UploadForm />)

    await user.upload(screen.getByLabelText("Arquivo de vídeo"), makeVideoFile())
    await user.click(screen.getByRole("button", { name: "Enviar vídeo" }))

    uploadInstances[0].options.onSuccess?.()

    expect(
      await screen.findByText(/Processando vídeo/, {}, { timeout: 3000 })
    ).toBeInTheDocument()
    expect(
      await screen.findByText("Vídeo pronto!", {}, { timeout: 5000 })
    ).toBeInTheDocument()
    expect(callCount).toBeGreaterThanOrEqual(2)
  }, 10000);

  it("shows a safe error message on UPLOAD_FILE_TOO_LARGE without leaking internals", async () => {
    const user = userEvent.setup()
    render(<UploadForm />)

    await user.upload(screen.getByLabelText("Arquivo de vídeo"), makeVideoFile())
    await user.click(screen.getByRole("button", { name: "Enviar vídeo" }))

    uploadInstances[0].options.onError?.(
      Object.assign(new Error("tus error"), {
        originalResponse: {
          getBody: () =>
            JSON.stringify({
              statusCode: 400,
              error: "UPLOAD_FILE_TOO_LARGE",
              message: "Upload exceeds the maximum allowed size of 10GB",
              code: null,
            }),
        },
      })
    )

    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent(/excede o tamanho máximo permitido/)
    expect(alert.textContent).not.toMatch(/UPLOAD_FILE_TOO_LARGE|statusCode/)
  })
})
