import * as React from "react"

import {
  ChannelSubscriptionProvider,
  ProvidedSubscriberCount,
} from "@/components/channels/channel-subscription-provider"
import { SubscribeButton } from "@/components/channels/subscribe-button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatVideosCount } from "@/lib/format"
import { cn } from "@/lib/utils"

type ChannelHeaderProps = {
  name: string
  nickname: string
  description?: string | null
  videosCount: number
  subscribersCount: number
  viewerSubscribed: boolean
  isAuthenticated: boolean
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
  subscribersCount,
  viewerSubscribed,
  isAuthenticated,
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
      {/* Contagem e botão dividem o provider da inscrição para "N inscritos"
          acompanhar o clique (social-interactions/TD-06 e TD-08); o botão fica
          à direita, na altura do nome (Figma `content-header` 59:16). */}
      <ChannelSubscriptionProvider
        nickname={nickname}
        initialSubscribed={viewerSubscribed}
        initialSubscribersCount={subscribersCount}
        isAuthenticated={isAuthenticated}
      >
        <div className="flex items-center gap-4">
          <Avatar size="xl" aria-label={name}>
            <AvatarFallback>{initialsOf(name)}</AvatarFallback>
          </Avatar>

          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-h2">{name}</h1>
              <SubscribeButton size="md" />
            </div>
            <p className="text-body-md text-muted-foreground">
              {`@${nickname} · `}
              <ProvidedSubscriberCount />
              {` · ${videosLabel}`}
            </p>
          </div>
        </div>
      </ChannelSubscriptionProvider>

      {description ? (
        <p className="text-body-md text-muted-foreground">{description}</p>
      ) : null}
    </header>
  )
}

export { ChannelHeader }
