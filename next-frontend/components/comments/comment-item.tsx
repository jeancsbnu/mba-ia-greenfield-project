import * as React from "react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatRelativeDate } from "@/lib/format"
import { cn } from "@/lib/utils"

// Iniciais de quem comentou: não há upload de avatar, então o fallback do
// Avatar é o caminho principal, como no restante do projeto.
function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return "?"
  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toLocaleUpperCase("pt-BR")
}

type CommentItemProps = {
  /** Nome de exibição do canal de quem comentou. */
  authorName: string
  /** ISO-8601 de criação do comentário. */
  createdAt: string
  body: string
  /** Linha de ações (curtir, não curtir, responder) — vem da tela. */
  actions?: React.ReactNode
  avatarSize?: "sm" | "default"
} & Omit<React.ComponentProps<"article">, "children">

// Um comentário-raiz: avatar, autor, timestamp relativo e corpo (Figma
// `comment-root` 77:137/77:176). Todo o I/O vive nos controles da linha de
// ações, que chegam prontos pelo slot `actions`.
function CommentItem({
  authorName,
  createdAt,
  body,
  actions,
  avatarSize = "default",
  className,
  ...props
}: CommentItemProps) {
  const date = formatRelativeDate(createdAt)

  return (
    <article
      data-slot="comment-item"
      className={cn("flex gap-3", className)}
      {...props}
    >
      <Avatar size={avatarSize} aria-label={authorName}>
        <AvatarFallback>{initialsOf(authorName)}</AvatarFallback>
      </Avatar>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="flex items-center gap-2 text-caption text-muted-foreground">
          <span className="text-label-md text-foreground">{authorName}</span>
          <time dateTime={createdAt} title={date.absolute}>
            {date.label}
          </time>
        </p>

        {/* Texto do comentário — o nó `comment-text` (77:144/77:183); o
            `comment-body` do Figma é só o contêiner. */}
        <p className="whitespace-pre-line break-words text-body-md text-foreground">
          {body}
        </p>

        {actions ? (
          <div data-slot="comment-actions" className="flex items-center gap-2">
            {actions}
          </div>
        ) : null}
      </div>
    </article>
  )
}

export { CommentItem }
export type { CommentItemProps }
