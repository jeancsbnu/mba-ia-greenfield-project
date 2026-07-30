"use client"

import * as React from "react"
import * as tus from "tus-js-client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import type { Video } from "@/lib/api/contracts"
import { cn } from "@/lib/utils"

const POLL_INTERVAL_MS = 1000

type UploadState =
  | { phase: "idle" }
  | { phase: "uploading"; progress: number }
  | { phase: "processing"; publicId: string }
  | { phase: "ready"; publicId: string }
  | { phase: "failed"; publicId: string }
  | { phase: "error"; message: string }

function mapUploadErrorToMessage(error: Error | tus.DetailedError): string {
  const body =
    "originalResponse" in error ? error.originalResponse?.getBody() : undefined

  if (body) {
    try {
      const parsed = JSON.parse(body) as { error?: string }
      if (parsed.error === "UPLOAD_FILE_TOO_LARGE") {
        return "O arquivo selecionado excede o tamanho máximo permitido (10GB)."
      }
      if (parsed.error === "UNAUTHORIZED") {
        return "Sua sessão expirou. Faça login novamente."
      }
    } catch {
      // Body isn't JSON (or is otherwise unparseable) — fall through to the generic message.
    }
  }

  return "Não foi possível concluir o upload. Tente novamente."
}

function UploadForm({ className, ...props }: React.ComponentProps<"div">) {
  const [file, setFile] = React.useState<File | null>(null)
  const [title, setTitle] = React.useState("")
  const [state, setState] = React.useState<UploadState>({ phase: "idle" })
  const publicIdRef = React.useRef("")

  React.useEffect(() => {
    if (state.phase !== "processing") return

    const publicId = state.publicId
    const interval = setInterval(() => {
      void (async () => {
        const res = await fetch(`/api/videos/${publicId}`)
        if (!res.ok) return

        const video = (await res.json()) as Video
        if (video.status === "ready") {
          setState({ phase: "ready", publicId })
        } else if (video.status === "failed") {
          setState({ phase: "failed", publicId })
        }
      })()
    }, POLL_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [state])

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null)
  }

  function startUpload() {
    if (!file) return

    setState({ phase: "uploading", progress: 0 })

    const upload = new tus.Upload(file, {
      endpoint: "/api/videos/upload",
      chunkSize: 5 * 1024 * 1024,
      retryDelays: [0, 1000, 3000, 5000],
      metadata: {
        title: title || file.name,
        filetype: file.type,
      },
      onError: (error) => {
        setState({ phase: "error", message: mapUploadErrorToMessage(error) })
      },
      onProgress: (bytesUploaded, bytesTotal) => {
        setState({
          phase: "uploading",
          progress: Math.round((bytesUploaded / bytesTotal) * 100),
        })
      },
      onAfterResponse: (req, res) => {
        if (req.getMethod() !== "POST") return
        publicIdRef.current = res.getHeader("X-Video-Public-Id") ?? ""
      },
      onSuccess: () => {
        setState({ phase: "processing", publicId: publicIdRef.current })
      },
    })

    upload.start()
  }

  return (
    <div
      data-slot="upload-form"
      className={cn("flex w-full flex-col gap-4", className)}
      {...props}
    >
      {state.phase === "error" && (
        <p role="alert" data-slot="upload-error" className="text-destructive">
          {state.message}
        </p>
      )}

      {(state.phase === "idle" || state.phase === "error") && (
        <>
          <div className="flex flex-col gap-2">
            <Label htmlFor="video-title">Título</Label>
            <Input
              id="video-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Título do vídeo"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="video-file">Arquivo de vídeo</Label>
            <input
              id="video-file"
              data-slot="upload-file-input"
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              className="text-body-md"
            />
          </div>

          <Button type="button" disabled={!file} onClick={startUpload}>
            Enviar vídeo
          </Button>
        </>
      )}

      {state.phase === "uploading" && (
        <div className="flex flex-col gap-2" data-slot="upload-progress">
          <Progress value={state.progress} />
          <p className="text-caption">{state.progress}% enviado</p>
        </div>
      )}

      {state.phase === "processing" && (
        <p data-slot="upload-processing">
          Upload concluído. Processando vídeo…
        </p>
      )}

      {state.phase === "ready" && (
        <p data-slot="upload-ready">Vídeo pronto!</p>
      )}

      {state.phase === "failed" && (
        <p role="alert" data-slot="upload-failed">
          O processamento do vídeo falhou. Tente enviar novamente.
        </p>
      )}
    </div>
  )
}

export { UploadForm }
