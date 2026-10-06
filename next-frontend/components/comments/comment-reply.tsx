import * as React from "react"

import {
  CommentItem,
  type CommentItemProps,
} from "@/components/comments/comment-item"
import { cn } from "@/lib/utils"

type CommentReplyProps = Omit<CommentItemProps, "avatarSize">

// Item de resposta (Figma `comment-reply` 77:150/77:162): a mesma estrutura do
// comentário-raiz, com avatar menor. O recuo vem da `ReplyList`, que é quem
// sabe que está dentro de uma thread.
function CommentReply({ className, ...props }: CommentReplyProps) {
  return (
    <CommentItem
      data-slot="comment-reply"
      avatarSize="sm"
      className={cn(className)}
      {...props}
    />
  )
}

export { CommentReply }
