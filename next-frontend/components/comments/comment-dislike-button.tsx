import * as React from "react"

import { cn } from "@/lib/utils"

type CommentDislikeButtonProps = {
  pressed: boolean
} & Omit<React.ComponentProps<"button">, "children" | "aria-pressed">

// "Não gostei" de comentário ou resposta (Figma `comment-dislike`
// 77:147/77:186) — sem número, coerente com social-interactions/TD-03.
function CommentDislikeButton({
  pressed,
  className,
  ...props
}: CommentDislikeButtonProps) {
  return (
    <button
      type="button"
      data-slot="comment-dislike-button"
      aria-pressed={pressed}
      className={cn(
        "text-caption font-weight-600 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-pressed:text-foreground disabled:opacity-50",
        className
      )}
      {...props}
    >
      Não gostei
    </button>
  )
}

export { CommentDislikeButton }
