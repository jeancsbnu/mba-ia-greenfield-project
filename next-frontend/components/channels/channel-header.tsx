import * as React from "react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatVideosCount } from "@/lib/format"
import { cn } from "@/lib/utils"

type ChannelHeaderProps = {
  name: string
  nickname: string
  description?: string | null
  videosCount: number
} & Omit<React.ComponentProps<"header">, "children">

// Iniciais do canal: não há upload de avatar nesta fase (decisão de /plan-resolve,
// OQ-21), então o fallback do Avatar é o caminho principal.
function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return "?"
  const letters = words.slice(0, 2).map((word) => word[0])
  return letters.join("").toUpperCase()
}

function ChannelHeader({
  name,
  nickname,
  description,
  videosCount,
  className,
  ...props
}: ChannelHeaderProps) {
  // Contagem só de vídeos publicados e públicos (TD-02/TD-06); o singular evita
  // o "1 vídeos" que o mock do Figma não cobre.
  const videosLabel = formatVideosCount(videosCount)

  return (
    <header
      data-slot="channel-header"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    >
      <div className="flex items-center gap-4">
        <Avatar size="xl" aria-label={name}>
          <AvatarFallback>{initialsOf(name)}</AvatarFallback>
        </Avatar>

        <div className="flex flex-col gap-1">
          <h1 className="text-h2">{name}</h1>
          <p className="text-body-md text-muted-foreground">
            {`@${nickname} · ${videosLabel}`}
          </p>
        </div>
      </div>

      {description ? (
        <p className="text-body-md text-muted-foreground">{description}</p>
      ) : null}
    </header>
  )
}

export { ChannelHeader }
