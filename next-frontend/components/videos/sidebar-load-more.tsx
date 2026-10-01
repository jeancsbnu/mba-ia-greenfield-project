"use client"

import * as React from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { VideoCard } from "@/components/videos/video-card"
import type { SuggestedVideoListItem } from "@/lib/api/contracts"
import { formatRelativeDate } from "@/lib/format"
import { SUGGESTIONS_PAGE_SIZE } from "@/lib/pagination"

type SidebarLoadMoreProps = {
  publicId: string
  /** Quantas sugestões o Server Component já renderizou acima deste bloco. */
  initialCount: number
  /** Total de elegíveis, que é como se sabe quando não há mais páginas. */
  total: number
}

// Controle "Ver mais" da sidebar (`72:62`), criado no frame em 2026-09-29 pela
// revisão do TD-04 que paginou as sugestões de 4 em 4.
//
// Ele é dono apenas das páginas SEGUINTES: a primeira vem renderizada pelo
// Server Component, e este componente acrescenta as demais abaixo dela — que
// é literalmente o que "acrescenta cards" pede, sem puxar a primeira página
// para o cliente só para poder paginá-la.
//
// Dois estados NÃO têm desenho (registrado nas Observations do inventário):
// carregando e "não há mais páginas". Resolvidos seguindo o padrão da Fase 04
// — `data-loading` no Button, que já trata opacidade e pointer-events, e
// desaparecer em vez de ficar inerte ao acabar, para não deixar na sidebar um
// alvo que não faz nada. `aria-live` anuncia as duas transições.
function SidebarLoadMore({
  publicId,
  initialCount,
  total,
}: SidebarLoadMoreProps) {
  const [extraItems, setExtraItems] = React.useState<SuggestedVideoListItem[]>(
    []
  )
  const [loading, setLoading] = React.useState(false)

  const loadedCount = initialCount + extraItems.length
  const hasMore = loadedCount < total

  async function loadMore() {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/videos/${publicId}/suggestions?offset=${String(loadedCount)}&limit=${String(SUGGESTIONS_PAGE_SIZE)}`
      )
      if (!response.ok) return

      const page = (await response.json()) as {
        items: SuggestedVideoListItem[]
      }
      setExtraItems((previous) => [...previous, ...page.items])
    } catch {
      // A sidebar degrada em silêncio: uma falha aqui não derruba o player.
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {extraItems.length > 0 ? (
        <ul className="flex flex-col gap-3.5">
          {extraItems.map((item) => (
            <li key={item.publicId}>
              <Link href={`/videos/${item.publicId}`}>
                <VideoCard
                  title={item.title}
                  thumbnailUrl={item.thumbnailUrl}
                  durationSeconds={item.durationSeconds}
                  viewsCount={item.viewsCount}
                  publishedAt={formatRelativeDate(item.publishedAt).label}
                />
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      {hasMore ? (
        <Button
          type="button"
          variant="secondary"
          className="w-full text-link"
          data-loading={loading}
          aria-busy={loading}
          onClick={() => {
            void loadMore()
          }}
        >
          {loading ? "Carregando…" : "Ver mais"}
        </Button>
      ) : null}

      <p aria-live="polite" className="sr-only">
        {loading
          ? "Carregando mais sugestões"
          : hasMore
            ? ""
            : "Não há mais sugestões"}
      </p>
    </>
  )
}

export { SidebarLoadMore }
