"use client"

import * as React from "react"

import type { Comment, RepliesPage } from "@/lib/api/contracts"

/** Teto da página de respostas aceito pelo backend. */
const MAX_REPLIES_PAGE = 50

type RepliesLoadMoreProps = {
  commentId: string
  loaded: number
  total: number
  onLoaded: (replies: Comment[]) => void
}

/**
 * "Ver mais N respostas" (Figma `replies-load-more` 77:174): busca as
 * respostas além das carregadas, a partir de `offset = loaded`, e entrega à
 * thread, que acrescenta (social-interactions/TD-05). Some quando completa.
 */
function RepliesLoadMore({
  commentId,
  loaded,
  total,
  onLoaded,
}: RepliesLoadMoreProps) {
  const [loading, setLoading] = React.useState(false)
  const [failed, setFailed] = React.useState(false)
  const remaining = total - loaded

  if (remaining <= 0) {
    return null
  }

  async function loadMore() {
    setLoading(true)
    setFailed(false)
    try {
      const limit = Math.min(remaining, MAX_REPLIES_PAGE)
      const response = await fetch(
        `/api/comments/${encodeURIComponent(commentId)}/replies?offset=${loaded}&limit=${limit}`
      )
      if (!response.ok) {
        setFailed(true)
        return
      }
      const page = (await response.json()) as RepliesPage
      onLoaded(page.items)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        data-slot="replies-load-more"
        onClick={loadMore}
        disabled={loading}
        aria-busy={loading}
        className="self-start text-caption font-weight-600 text-link hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
      >
        {loading
          ? "Carregando respostas…"
          : remaining === 1
            ? "Ver mais 1 resposta"
            : `Ver mais ${remaining} respostas`}
      </button>
      {failed ? (
        <p role="alert" className="text-caption text-destructive">
          Não foi possível carregar as respostas.
        </p>
      ) : null}
    </div>
  )
}

export { RepliesLoadMore }
