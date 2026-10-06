import * as React from "react"

import { cn } from "@/lib/utils"

type CommentThreadProps = {
  /** O comentário-raiz, já renderizado. */
  root: React.ReactNode
  /** A lista de respostas; ausente quando a thread não tem respostas. */
  replies?: React.ReactNode
  /** Compositor de resposta aberto sob a thread, quando houver. */
  composer?: React.ReactNode
} & Omit<React.ComponentProps<"div">, "children">

// Uma thread: a raiz e, quando existe, a lista de respostas (Figma
// `comment-thread` 77:136 com respostas, 77:175 sem). Profundidade 1
// (social-interactions/TD-04): há no máximo uma lista de respostas por thread.
function CommentThread({
  root,
  replies,
  composer,
  className,
  ...props
}: CommentThreadProps) {
  return (
    <div
      data-slot="comment-thread"
      className={cn("flex flex-col gap-3", className)}
      {...props}
    >
      {root}
      {replies ?? null}
      {composer ?? null}
    </div>
  )
}

export { CommentThread }
