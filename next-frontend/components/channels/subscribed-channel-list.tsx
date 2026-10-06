import * as React from "react"

import { SubscribedChannelCard } from "@/components/channels/subscribed-channel-card"
import type { SubscribedChannel } from "@/lib/api/contracts"
import { cn } from "@/lib/utils"

type SubscribedChannelListProps = {
  channels: SubscribedChannel[]
} & Omit<React.ComponentProps<"ul">, "children">

// Lista dos canais seguidos (Figma `channel-list` 75:79), na ordem do backend:
// o seguido mais recentemente primeiro. Lista vazia não tem desenho e segue os
// padrões de vazio da Fase 04 (OQ-14).
function SubscribedChannelList({
  channels,
  className,
  ...props
}: SubscribedChannelListProps) {
  if (channels.length === 0) {
    return (
      <p
        data-slot="subscriptions-empty"
        className="rounded-[var(--radius-4)] border border-border bg-card px-6 py-16 text-center text-body-lg text-muted-foreground"
      >
        Você ainda não segue nenhum canal
      </p>
    )
  }

  return (
    <ul
      data-slot="subscribed-channel-list"
      className={cn("flex flex-col gap-3", className)}
      {...props}
    >
      {channels.map((channel) => (
        <SubscribedChannelCard key={channel.nickname} channel={channel} />
      ))}
    </ul>
  )
}

export { SubscribedChannelList }
