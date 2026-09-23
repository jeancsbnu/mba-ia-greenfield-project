import * as React from "react"
import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { VideoStatusBadge, type VideoStatus } from "@/components/videos/video-status-badge"
import {
  VideoVisibilityBadge,
  type VideoVisibility,
} from "@/components/videos/video-visibility-badge"
import { cn } from "@/lib/utils"

type VideoTableRow = {
  publicId: string
  title: string
  thumbnailUrl: string | null
  durationSeconds: number | null
  status: VideoStatus
  visibility: VideoVisibility
  publishedAt: string | null
  viewsCount: number
  likesCount: number
  commentsCount: number
}

type VideoTableProps = {
  videos: VideoTableRow[]
  /** Rótulo relativo ("há 3 dias") com a data absoluta no `title` do elemento. */
  formatPublishedAt?: (isoDate: string) => { label: string; absolute: string }
} & Omit<React.ComponentProps<"div">, "children">

const EMPTY = "—"

function formatDuration(durationSeconds: number | null): string {
  if (durationSeconds === null || durationSeconds < 0) return EMPTY
  const minutes = Math.floor(durationSeconds / 60)
  const seconds = Math.floor(durationSeconds % 60)
  return `${minutes}:${String(seconds).padStart(2, "0")}`
}

function defaultFormatPublishedAt(isoDate: string) {
  const absolute = new Date(isoDate).toLocaleDateString("pt-BR")
  return { label: absolute, absolute }
}

function VideoTable({
  videos,
  formatPublishedAt = defaultFormatPublishedAt,
  className,
  ...props
}: VideoTableProps) {
  const number = new Intl.NumberFormat("pt-BR")

  return (
    <div
      data-slot="video-table"
      className={cn(
        "w-full overflow-hidden rounded-[var(--radius-4)] border border-border bg-card shadow-showcase-card",
        className
      )}
      {...props}
    >
      <table className="w-full border-collapse text-left">
      <thead>
        <tr className="border-b border-border bg-muted/40">
          <th scope="col" className="px-6 py-3.5 text-caption uppercase text-muted-foreground">Vídeo</th>
          <th scope="col" className="px-6 py-3.5 text-caption uppercase text-muted-foreground">Visibilidade</th>
          <th scope="col" className="px-6 py-3.5 text-caption uppercase text-muted-foreground">Status</th>
          <th scope="col" className="px-6 py-3.5 text-right text-caption uppercase text-muted-foreground">Views</th>
          <th scope="col" className="px-6 py-3.5 text-right text-caption uppercase text-muted-foreground">Likes</th>
          <th scope="col" className="px-6 py-3.5 text-right text-caption uppercase text-muted-foreground">Coment.</th>
          <th scope="col" className="px-6 py-3.5 text-right text-caption uppercase text-muted-foreground">Publicação</th>
          {/* A coluna de ações não tem rótulo visível no Figma; o sr-only mantém
              a tabela navegável por leitor de tela. */}
          <th scope="col" className="sr-only">Ações</th>
        </tr>
      </thead>

      <tbody>
        {videos.map((video) => {
          const isPublished = video.publishedAt !== null
          const published = isPublished
            ? formatPublishedAt(video.publishedAt as string)
            : null

          return (
            <tr
              key={video.publicId}
              data-slot="video-table-row"
              className="h-22 border-b border-border last:border-b-0"
            >
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="relative h-14 w-25 shrink-0 overflow-hidden rounded-[var(--radius-2)] bg-muted">
                    {video.thumbnailUrl ? (
                      <Image
                        src={video.thumbnailUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="100px"
                      />
                    ) : null}
                  </div>
                  <div className="flex w-[154px] min-w-0 flex-col">
                    <span className="truncate text-label-lg text-foreground">
                      {video.title}
                    </span>
                    <span className="text-caption text-muted-foreground">
                      {formatDuration(video.durationSeconds)}
                    </span>
                  </div>
                </div>
              </td>

              <td className="px-6 py-4">
                <VideoVisibilityBadge
                  visibility={video.visibility}
                  isPublished={isPublished}
                />
              </td>

              <td className="px-6 py-4">
                <VideoStatusBadge
                  status={video.status}
                  isPublished={isPublished}
                />
              </td>

              {/* Rascunho não tem métricas nem publicação: o Figma mostra "—". */}
              <td className="px-6 py-4 text-right">
                {isPublished ? number.format(video.viewsCount) : EMPTY}
              </td>
              <td className="px-6 py-4 text-right">
                {isPublished ? number.format(video.likesCount) : EMPTY}
              </td>
              <td className="px-6 py-4 text-right">
                {isPublished ? number.format(video.commentsCount) : EMPTY}
              </td>

              <td className="px-6 py-4 text-right">
                {published ? (
                  <time dateTime={video.publishedAt as string} title={published.absolute}>
                    {published.label}
                  </time>
                ) : (
                  EMPTY
                )}
              </td>

              <td className="px-6 py-4 text-right">
                <Button asChild variant="outline">
                  {/* O nome acessível inclui o título: "Editar" sozinho se repete
                      em todas as linhas e não identifica o alvo. */}
                  <Link
                    href={`/videos/${video.publicId}/edit`}
                    aria-label={`Editar ${video.title}`}
                  >
                    Editar
                  </Link>
                </Button>
              </td>
            </tr>
          )
        })}
      </tbody>
      </table>
    </div>
  )
}

export { VideoTable }
export type { VideoTableRow }
