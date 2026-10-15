import * as React from "react"
import Image from "next/image"
import Link from "next/link"

import { ChannelAvatar } from "@/components/channels/channel-avatar"
import { cn } from "@/lib/utils"

type VideoCardChannel = {
  name: string
  nickname: string
}

type VideoCardProps = {
  publicId: string
  title: string
  thumbnailUrl: string | null
  durationSeconds: number | null
  viewsCount: number
  publishedAt: string
  // Linha do canal (avatar + nome). Home e resultados passam; a página do
  // canal não, porque seria redundante, e a sidebar da watch page também não,
  // para manter o desenho da Fase 05.
  channel?: VideoCardChannel
  size?: "desktop" | "mobile"
} & Omit<React.ComponentProps<"article">, "children">

// Largura em que a thumbnail é servida (componente Figma `video-card-feed`,
// size=…): no desktop, a coluna de 233px do desenho a partir de `lg` e a grade
// responsiva abaixo disso; no mobile, a largura cheia.
const THUMBNAIL_SIZES = {
  desktop: "(min-width: 1024px) 233px, (min-width: 640px) 50vw, 100vw",
  mobile: "100vw",
} as const

// Duração como m:ss — o formato que o Figma mostra no overlay.
function formatDuration(durationSeconds: number | null): string | null {
  if (durationSeconds === null || durationSeconds < 0) return null
  const minutes = Math.floor(durationSeconds / 60)
  const seconds = Math.floor(durationSeconds % 60)
  return `${minutes}:${String(seconds).padStart(2, "0")}`
}

// O card é dono dos próprios links, irmãos e sem aninhamento
// (home-busca/TD-01, Revision de 2026-10-11): thumbnail e título levam ao
// vídeo; avatar e nome levam ao canal. Quem renderiza o card não o envolve
// num <Link>, senão haveria <a> dentro de <a>.
function VideoCard({
  publicId,
  title,
  thumbnailUrl,
  durationSeconds,
  viewsCount,
  publishedAt,
  channel,
  size = "desktop",
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
  const videoHref = `/videos/${publicId}`
  const channelHref = channel ? `/@${channel.nickname}` : null

  const titleAndMeta = (
    <>
      <h3
        className={cn(
          "text-label-lg text-foreground",
          channel ? "line-clamp-2" : "truncate"
        )}
      >
        <Link href={videoHref} className="hover:underline">
          {title}
        </Link>
      </h3>

      {channel && channelHref ? (
        <Link
          href={channelHref}
          data-slot="video-card-channel"
          className="truncate text-caption text-muted-foreground hover:text-foreground"
        >
          {channel.name}
        </Link>
      ) : null}

      <p className="truncate text-caption text-muted-foreground">
        {`${views} visualizações · ${publishedAt}`}
      </p>
    </>
  )

  return (
    <article
      data-slot="video-card"
      data-size={size}
      className={cn("flex w-full flex-col gap-2", className)}
      {...props}
    >
      {/* Fora da ordem de tabulação: o título é o link nomeado para o mesmo
          destino, e a thumbnail decorativa não tem nome próprio. */}
      <Link
        href={videoHref}
        tabIndex={-1}
        aria-hidden="true"
        className="relative block aspect-video w-full overflow-hidden rounded-[var(--radius-2)] bg-muted"
      >
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt=""
            fill
            className="object-cover"
            sizes={THUMBNAIL_SIZES[size]}
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
      </Link>

      {channel && channelHref ? (
        <div className="flex gap-2.5">
          {/* Mesmo destino do nome do canal, que é o link nomeado. */}
          <Link href={channelHref} tabIndex={-1} aria-hidden="true">
            <ChannelAvatar nickname={channel.nickname} name={channel.name} />
          </Link>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            {titleAndMeta}
          </div>
        </div>
      ) : (
        titleAndMeta
      )}
    </article>
  )
}

export { VideoCard }
