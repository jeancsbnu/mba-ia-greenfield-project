import * as React from "react"

import { formatCount } from "@/lib/format"
import { cn } from "@/lib/utils"

type CommentLikeButtonProps = {
  pressed: boolean
  count: number
} & Omit<React.ComponentProps<"button">, "children" | "aria-pressed">

// "Gostei · N" de comentário ou resposta (Figma `comment-like` 77:146/77:185):
// texto Semi Bold em cor muted, sem caixa — a linha de ações do comentário não
// usa o primitivo Button. Estado e mutação vêm do `CommentReactions`.
function CommentLikeButton({
  pressed,
  count,
  className,
  ...props
}: CommentLikeButtonProps) {
  return (
    <button
      type="button"
      data-slot="comment-like-button"
      aria-pressed={pressed}
      className={cn(
        "text-caption font-weight-600 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-pressed:text-foreground disabled:opacity-50",
        className
      )}
      {...props}
    >
      {`Gostei · ${formatCount(count)}`}
    </button>
  )
}

export { CommentLikeButton }
