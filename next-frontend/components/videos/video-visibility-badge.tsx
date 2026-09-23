import * as React from "react"

import { Badge } from "@/components/ui/badge"

type VideoVisibility = "public" | "unlisted"

type VideoVisibilityBadgeProps = {
  visibility: VideoVisibility
  /** Rascunho não expõe visibilidade: o Figma mostra "—" na coluna. */
  isPublished: boolean
} & Omit<React.ComponentProps<typeof Badge>, "children" | "variant">

// `unlisted` é rotulado como "Indisponível" na UI — o termo em inglês nunca
// aparece para o usuário (TD-02, revisão 2026-08-08).
function VideoVisibilityBadge({
  visibility,
  isPublished,
  ...props
}: VideoVisibilityBadgeProps) {
  if (!isPublished) {
    return (
      <Badge
        variant="secondary"
        className="text-muted-foreground"
        data-visibility="none"
        {...props}
      >
        —
      </Badge>
    )
  }

  return visibility === "unlisted" ? (
    <Badge variant="warning" data-visibility="unlisted" {...props}>
      Indisponível
    </Badge>
  ) : (
    <Badge
      variant="secondary"
      className="text-muted-foreground"
      data-visibility="public"
      {...props}
    >
      Público
    </Badge>
  )
}

export { VideoVisibilityBadge }
export type { VideoVisibility }
