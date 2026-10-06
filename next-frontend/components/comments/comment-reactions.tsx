"use client"

import * as React from "react"

import { CommentDislikeButton } from "@/components/comments/comment-dislike-button"
import { CommentLikeButton } from "@/components/comments/comment-like-button"
import { useReaction, type ReactionValue } from "@/hooks/use-reaction"

const ERROR_MESSAGES: Record<string, string> = {
  RATE_LIMIT_EXCEEDED: "Muitas reações em pouco tempo.",
  COMMENT_NOT_FOUND: "Este comentário não está mais disponível.",
}
const FALLBACK_ERROR = "Não foi possível registrar sua reação."

type CommentReactionsProps = {
  commentId: string
  initialReaction: ReactionValue
  initialLikesCount: number
  isAuthenticated: boolean
}

/**
 * Par like/dislike de um comentário ou resposta — mesmo hook do vídeo
 * (social-interactions/TD-08), sobre `/api/comments/{commentId}/reaction`.
 */
function CommentReactions({
  commentId,
  initialReaction,
  initialLikesCount,
  isAuthenticated,
}: CommentReactionsProps) {
  const { state, toggleLike, toggleDislike, errorCode } = useReaction({
    initial: { viewerReaction: initialReaction, likesCount: initialLikesCount },
    endpoint: `/api/comments/${encodeURIComponent(commentId)}/reaction`,
    isAuthenticated,
  })

  return (
    <>
      <CommentLikeButton
        pressed={state.viewerReaction === "like"}
        count={state.likesCount}
        onClick={toggleLike}
      />
      <CommentDislikeButton
        pressed={state.viewerReaction === "dislike"}
        onClick={toggleDislike}
      />
      {errorCode ? (
        <span
          role="alert"
          data-slot="comment-reaction-error"
          className="text-caption text-destructive"
        >
          {ERROR_MESSAGES[errorCode] ?? FALLBACK_ERROR}
        </span>
      ) : null}
    </>
  )
}

export { CommentReactions }
