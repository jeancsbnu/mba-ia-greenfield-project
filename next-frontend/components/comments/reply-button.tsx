"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"

type ReplyButtonProps = {
  /** Estado aberto controlado pelo pai; sem ele, o botão guarda o próprio. */
  expanded?: boolean
  /** Chamado com o novo estado a cada clique. */
  onToggle?: (expanded: boolean) => void
  /** Id do compositor que o botão abre, para `aria-controls`. */
  controls?: string
} & Omit<React.ComponentProps<typeof Button>, "onClick" | "aria-expanded">

// "Responder" (Figma `comment-reply-action` 77:148/77:187/77:161): só abre e
// fecha o compositor de resposta. Quem publica é o NewCommentForm reusado com
// parentId (OQ-12) — este botão nunca faz I/O.
function ReplyButton({
  expanded,
  onToggle,
  controls,
  children = "Responder",
  ...props
}: ReplyButtonProps) {
  const [internalExpanded, setInternalExpanded] = React.useState(false)
  const isExpanded = expanded ?? internalExpanded

  function handleClick() {
    const next = !isExpanded
    if (expanded === undefined) setInternalExpanded(next)
    onToggle?.(next)
  }

  return (
    <Button
      type="button"
      variant="link"
      data-slot="reply-button"
      aria-expanded={isExpanded}
      aria-controls={controls}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Button>
  )
}

export { ReplyButton }
