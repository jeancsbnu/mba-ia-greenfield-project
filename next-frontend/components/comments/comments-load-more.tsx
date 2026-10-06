"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import type { CommentsPage, CommentThread } from "@/lib/api/contracts"
import { cn } from "@/lib/utils"

/** Raízes por página (social-interactions/TD-05). */
export const COMMENTS_PAGE_SIZE = 10

type CommentsLoadMoreProps = {
  publicId: string
  loaded: number
  total: number
  onLoaded: (threads: CommentThread[]) => void
  className?: string
}

/**
 * "Carregar mais comentários" (Figma `comments-load-more` 77:188): busca a
 * próxima página de raízes e entrega à CommentsSection, que acrescenta. Some
 * quando o carregado alcança o total.
 */
function CommentsLoadMore({
  publicId,
  loaded,
  total,
  onLoaded,
  className,
}: CommentsLoadMoreProps) {
  const [loading, setLoading] = React.useState(false)
  const [failed, setFailed] = React.useState(false)

  if (loaded >= total) {
    return null
  }

  async function loadMore() {
    setLoading(true)
    setFailed(false)
    try {
      const response = await fetch(
        `/api/videos/${encodeURIComponent(publicId)}/comments?offset=${loaded}&limit=${COMMENTS_PAGE_SIZE}`
      )
      if (!response.ok) {
        setFailed(true)
        return
      }
      const page = (await response.json()) as CommentsPage
      onLoaded(page.items)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <Button
        type="button"
        variant="secondary"
        data-slot="comments-load-more"
        className="w-full"
        onClick={loadMore}
        disabled={loading}
        aria-busy={loading}
      >
        {loading ? "Carregando comentários…" : "Carregar mais comentários"}
      </Button>
      {failed ? (
        <p role="alert" className="text-caption text-destructive">
          Não foi possível carregar mais comentários.
        </p>
      ) : null}
    </div>
  )
}

export { CommentsLoadMore }
