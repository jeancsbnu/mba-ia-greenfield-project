import * as React from "react"
import Link from "next/link"

import {
  ChannelSubscriptionProvider,
  ProvidedSubscriberCount,
} from "@/components/channels/channel-subscription-provider"
import { SubscriptionButton } from "@/components/channels/subscription-button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { SubscribedChannel } from "@/lib/api/contracts"
import { formatVideosCount } from "@/lib/format"
import { cn } from "@/lib/utils"

type SubscribedChannelCardProps = {
  channel: SubscribedChannel
} & Omit<React.ComponentProps<"li">, "children">

// Iniciais do canal: não há upload de avatar (OQ-21), então o fallback do
// Avatar é o caminho principal.
function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return "?"
  const letters = words.slice(0, 2).map((word) => word[0])
  return letters.join("").toUpperCase()
}

// Linha da área de canais seguidos (Figma `channel-row` 75:80). O nome é o
// atalho para a página pública do canal — o "acesso rápido aos vídeos"
// (social-interactions/TD-07, Revisions de 2026-10-04). Botão e contagem
// dividem o provider da linha, para "N inscritos" acompanhar o toggle.
function SubscribedChannelCard({
  channel,
  className,
  ...props
}: SubscribedChannelCardProps) {
  return (
    <li
      data-slot="subscribed-channel-card"
      className={cn(
        "flex items-center gap-4 rounded-[var(--radius-4)] border border-border bg-card px-5 py-4",
        className
      )}
      {...props}
    >
      <ChannelSubscriptionProvider
        nickname={channel.nickname}
        initialSubscribed
        initialSubscribersCount={channel.subscribersCount}
        isAuthenticated
      >
        <Avatar size="lg" aria-hidden="true">
          <AvatarFallback>{initialsOf(channel.name)}</AvatarFallback>
        </Avatar>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Link
            href={`/@${channel.nickname}`}
            className="text-label-lg text-foreground hover:underline"
          >
            {channel.name}
          </Link>
          <p className="text-caption text-muted-foreground">
            <ProvidedSubscriberCount />
            {` · ${formatVideosCount(channel.videosCount)}`}
          </p>
        </div>

        <SubscriptionButton />
      </ChannelSubscriptionProvider>
    </li>
  )
}

export { SubscribedChannelCard }
