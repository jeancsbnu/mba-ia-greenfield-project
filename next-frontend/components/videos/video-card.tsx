import * as React from "react"
import Image from "next/image"

import { cn } from "@/lib/utils"

type VideoCardProps = {
  title: string
  thumbnailUrl: string | null
  durationSeconds: number | null
  viewsCount: number
  publishedAt: string
} & Omit<React.ComponentProps<"article">, "children">

// Duração como m:ss — o formato que o Figma mostra no overlay.
function formatDuration(durationSeconds: number | null): string | null {
  if (durationSeconds === null || durationSeconds < 0) return null
  const minutes = Math.floor(durationSeconds / 60)
  const seconds = Math.floor(durationSeconds % 60)
  return `${minutes}:${String(seconds).padStart(2, "0")}`
}

function VideoCard({
  title,
  thumbnailUrl,
  durationSeconds,
  viewsCount,
  publishedAt,
  className,
  ...props
}: VideoCardProps) {
  const duration = formatDuration(durationSeconds)
  // Notação compacta, como o design escreve ("1,2 mil visualizações"); o
  // separador de milhar cheio ("1.200") ocupa mais espaço numa linha que já
  // trunca.
  const views = new Intl.NumberFormat("pt-BR", { notation: "compact" }).format(
    viewsCount
  )

  return (
    <article
      data-slot="video-card"
      className={cn("flex w-full flex-col gap-2", className)}
      {...props}
    >
      <div className="relative aspect-video w-full overflow-hidden rounded-[var(--radius-2)] bg-muted">
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt=""
            fill
            className="object-cover"
            sizes="233px"
          />
        ) : null}

        {duration ? (
          // Overlay interno do card, não uma variante do Badge (decisão OQ-20).
          <span
            data-slot="video-card-duration"
            className="absolute right-1 bottom-1 rounded-[var(--radius-1)] bg-overlay px-1.5 py-0.5 text-overlay"
          >
            {duration}
          </span>
        ) : null}
      </div>

      <h3 className="truncate text-label-lg text-foreground">{title}</h3>

      <p className="truncate text-caption text-muted-foreground">
        {`${views} visualizações · ${publishedAt}`}
      </p>
    </article>
  )
}

export { VideoCard }
