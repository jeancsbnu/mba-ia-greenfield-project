"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type ThumbnailUploaderProps = {
  /** URL única já resolvida pela API (custom ou auto-gerada, per TD-04). */
  thumbnailUrl: string | null
  /** Recebe o arquivo escolhido; o envio acontece no submit do form (TD-03). */
  onFileSelect?: (file: File | null) => void
  error?: string | null
} & Omit<React.ComponentProps<"div">, "children" | "onSelect">

const HELPER_ID = "thumbnail-helper"
const ERROR_ID = "thumbnail-error"

// Coluna esquerda da edição de vídeo. Escolher o arquivo só gera preview local:
// a gravação acontece junto do submit do formulário (TD-03, revisão 2026-09-20).
function ThumbnailUploader({
  thumbnailUrl,
  onFileSelect,
  error = null,
  className,
  ...props
}: ThumbnailUploaderProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)

  // O object URL do preview precisa ser revogado para não vazar memória.
  React.useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null

    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current)
      return file ? URL.createObjectURL(file) : null
    })

    onFileSelect?.(file)
  }

  const shownUrl = previewUrl ?? thumbnailUrl

  return (
    <div
      data-slot="thumbnail-uploader"
      className={cn("flex w-full flex-col gap-3", className)}
      {...props}
    >
      <Card className="flex flex-col gap-4 p-4">
        <h2 className="text-label-lg text-foreground">Thumbnail atual</h2>

        <div className="aspect-video w-full overflow-hidden rounded-[var(--radius-2)] bg-muted">
          {shownUrl ? (
            // Preview local (blob) e URL remota convivem aqui; next/image não
            // otimiza blob, então o preview usa <img> por necessidade técnica.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shownUrl}
              alt="Pré-visualização da thumbnail do vídeo"
              className="size-full object-cover"
            />
          ) : null}
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => inputRef.current?.click()}
        >
          Alterar thumbnail
        </Button>

        <input
          ref={inputRef}
          type="file"
          name="thumbnail"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          aria-label="Alterar thumbnail"
          aria-describedby={error ? `${HELPER_ID} ${ERROR_ID}` : HELPER_ID}
          onChange={handleChange}
        />

        <p id={HELPER_ID} className="text-helper text-muted-foreground">
          Auto-gerada ou personalizada - 16:9 recomendada
        </p>

        {error ? (
          <p id={ERROR_ID} role="alert" className="text-helper text-destructive">
            {error}
          </p>
        ) : null}
      </Card>
    </div>
  )
}

export { ThumbnailUploader }
