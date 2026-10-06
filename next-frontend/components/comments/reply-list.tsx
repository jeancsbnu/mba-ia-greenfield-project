import * as React from "react"

import { cn } from "@/lib/utils"

type ReplyListProps = {
  /** O "Ver mais N respostas" da thread, renderizado depois das respostas. */
  loadMore?: React.ReactNode
} & Omit<React.ComponentProps<"div">, "role">

// Respostas de uma thread (Figma `reply-list` 77:149): até 3 pré-carregadas e
// as que o "ver mais" acrescentar (social-interactions/TD-05), na ordem
// recebida. O recuo em relação à raiz mora aqui, que é quem sabe que está
// dentro de uma thread.
function ReplyList({
  loadMore,
  className,
  children,
  ...props
}: ReplyListProps) {
  return (
    <div
      data-slot="reply-list"
      className={cn("flex flex-col gap-3 pl-12", className)}
      {...props}
    >
      <ul role="list" className="flex flex-col gap-3">
        {React.Children.map(children, (child) =>
          child === null || child === undefined || child === false ? null : (
            <li>{child}</li>
          )
        )}
      </ul>
      {loadMore ?? null}
    </div>
  )
}

export { ReplyList }
