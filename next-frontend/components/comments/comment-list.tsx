import * as React from "react"

import { cn } from "@/lib/utils"

type CommentListProps = Omit<React.ComponentProps<"ul">, "role">

// Lista das threads de comentário (Figma `comment-list` 77:135). Não busca
// nada: renderiza as threads que a CommentsSection passa, na ordem recebida
// (mais recentes primeiro, per social-interactions/TD-05).
function CommentList({ className, children, ...props }: CommentListProps) {
  return (
    <ul
      data-slot="comment-list"
      role="list"
      className={cn("flex flex-col gap-5", className)}
      {...props}
    >
      {React.Children.map(children, (child) =>
        child === null || child === undefined || child === false ? null : (
          <li>{child}</li>
        )
      )}
    </ul>
  )
}

export { CommentList }
