"use client"

import * as React from "react"

import { DislikeButton } from "@/components/videos/dislike-button"
import { LikeButton } from "@/components/videos/like-button"
import { useReaction, type ReactionValue } from "@/hooks/use-reaction"
import { cn } from "@/lib/utils"

// Tratamento por código de erro (§UI Contracts → Error Catalog → UX mapping da
// watch page). UNAUTHORIZED não chega aqui: o hook leva ao login.
const ERROR_MESSAGES: Record<string, string> = {
  RATE_LIMIT_EXCEEDED:
    "Muitas reações em pouco tempo. Tente de novo em instantes.",
  VIDEO_NOT_FOUND: "Este vídeo não está mais disponível.",
}
const FALLBACK_ERROR = "Não foi possível registrar sua reação."

type VideoReactionsProps = {
  publicId: string
  initialReaction: ReactionValue
  initialLikesCount: number
  isAuthenticated: boolean
} & Omit<React.ComponentProps<"div">, "children">

/**
 * Dono do par like/dislike do vídeo (social-interactions/TD-08): os dois são
 * mutuamente exclusivos e o "Gostei · N" muda no mesmo frame do clique.
 */
function VideoReactions({
  publicId,
  initialReaction,
  initialLikesCount,
  isAuthenticated,
  className,
  ...props
}: VideoReactionsProps) {
  const { state, toggleLike, toggleDislike, errorCode } = useReaction({
    initial: { viewerReaction: initialReaction, likesCount: initialLikesCount },
    endpoint: `/api/videos/${encodeURIComponent(publicId)}/reaction`,
    isAuthenticated,
  })

  return (
    <div
      data-slot="video-reactions"
      className={cn("flex flex-col items-end gap-1", className)}
      {...props}
    >
      <div className="flex items-center gap-2">
        <LikeButton
          pressed={state.viewerReaction === "like"}
          count={state.likesCount}
          onClick={toggleLike}
        />
        <DislikeButton
          pressed={state.viewerReaction === "dislike"}
          onClick={toggleDislike}
        />
      </div>
      {errorCode ? (
        <p
          role="alert"
          data-slot="reaction-error"
          className="text-caption text-destructive"
        >
          {ERROR_MESSAGES[errorCode] ?? FALLBACK_ERROR}
        </p>
      ) : null}
    </div>
  )
}

export { VideoReactions }
