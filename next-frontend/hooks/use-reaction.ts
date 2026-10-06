"use client"

import { useOptimistic, useState, useTransition } from "react"
import { usePathname, useRouter } from "next/navigation"

import type { ReactionState, ReactionType } from "@/lib/api/contracts"
import { buildLoginHref } from "@/lib/auth/return-to"
import { sendMutation } from "@/lib/social/mutation"

export type ReactionValue = ReactionType | null

export type ReactionSnapshot = {
  viewerReaction: ReactionValue
  likesCount: number
}

/** Clicar no estado já ativo retira a reação; clicar no outro troca. */
export function reactionAfterClick(
  current: ReactionValue,
  clicked: ReactionType
): ReactionValue {
  return current === clicked ? null : clicked
}

/**
 * Mesma tabela de delta do backend (social-interactions/TD-02), aplicada no
 * cliente para a contagem otimista. Dislike nunca conta (TD-03).
 */
export function applyReactionDelta(
  state: ReactionSnapshot,
  next: ReactionValue
): ReactionSnapshot {
  return {
    viewerReaction: next,
    likesCount:
      state.likesCount -
      (state.viewerReaction === "like" ? 1 : 0) +
      (next === "like" ? 1 : 0),
  }
}

type UseReactionOptions = {
  initial: ReactionSnapshot
  /** Rota BFF da reação: `/api/videos/{publicId}/reaction` ou de comentário. */
  endpoint: string
  isAuthenticated: boolean
}

/**
 * Estado otimista de um par like/dislike (social-interactions/TD-08 —
 * `useOptimistic` do React 19). Like e dislike são mutuamente exclusivos e a
 * contagem acompanha o clique antes da resposta; a resposta da API é a que
 * fica, e uma falha volta ao estado anterior. Para o anônimo, o clique leva ao
 * login com `returnTo` (social-interactions-anonymous-gate/TD-01 e TD-03).
 */
export function useReaction({ initial, endpoint, isAuthenticated }: UseReactionOptions) {
  const router = useRouter()
  const pathname = usePathname()
  const [state, setState] = useState<ReactionSnapshot>(initial)
  const [optimistic, setOptimistic] = useOptimistic(state, applyReactionDelta)
  const [isPending, startTransition] = useTransition()
  const [errorCode, setErrorCode] = useState<string | null>(null)

  function react(clicked: ReactionType) {
    if (!isAuthenticated) {
      router.push(buildLoginHref(pathname))
      return
    }

    const next = reactionAfterClick(optimistic.viewerReaction, clicked)
    setErrorCode(null)

    startTransition(async () => {
      setOptimistic(next)
      const outcome =
        next === null
          ? await sendMutation<ReactionState>(endpoint, "DELETE")
          : await sendMutation<ReactionState>(endpoint, "PUT", { type: next })

      if (outcome.ok) {
        // Atualizações depois de um await saem da transição; embrulhar de novo
        // mantém a troca do otimista pelo valor real num render só.
        startTransition(() =>
          setState({
            viewerReaction: outcome.data.viewerReaction,
            likesCount: outcome.data.likesCount,
          })
        )
        return
      }

      if (outcome.status === 401) {
        router.push(buildLoginHref(pathname))
        return
      }

      startTransition(() => setErrorCode(outcome.error))
    })
  }

  return {
    state: optimistic,
    toggleLike: () => react("like"),
    toggleDislike: () => react("dislike"),
    isPending,
    errorCode,
  }
}
