import * as React from "react"

import { Badge } from "@/components/ui/badge"

type VideoStatus = "draft" | "processing" | "ready" | "failed"

type VideoStatusBadgeProps = {
  status: VideoStatus
  /** `true` quando `published_at` não é nulo (TD-02: eixo independente de `status`). */
  isPublished: boolean
} & Omit<React.ComponentProps<typeof Badge>, "children" | "variant">

// Dois eixos independentes (TD-02): a publicação vem de `published_at` e o
// ciclo de vida vem de `status`, escrito pelo worker. O chip principal mostra a
// publicação; o `status` só aparece quando ainda não está pronto.
function VideoStatusBadge({
  status,
  isPublished,
  ...props
}: VideoStatusBadgeProps) {
  if (status === "processing") {
    return (
      <Badge variant="secondary" data-status="processing" {...props}>
        Processando
      </Badge>
    )
  }

  if (status === "failed") {
    return (
      <Badge variant="destructive" data-status="failed" {...props}>
        Falhou
      </Badge>
    )
  }

  return isPublished ? (
    <Badge variant="success" data-status="published" {...props}>
      Publicado
    </Badge>
  ) : (
    <Badge
      variant="secondary"
      className="text-muted-foreground"
      data-status="draft"
      {...props}
    >
      Rascunho
    </Badge>
  )
}

export { VideoStatusBadge }
export type { VideoStatus }
