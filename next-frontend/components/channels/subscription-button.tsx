"use client"

import * as React from "react"

import { SubscribeButton } from "@/components/channels/subscribe-button"

type SubscriptionButtonProps = Omit<
  React.ComponentProps<typeof SubscribeButton>,
  "size"
>

// Toggle de cada linha da área de canais seguidos (Figma `unsubscribe-button`
// 75:86/75:94/75:102). Estado, mutação e mensagens de erro são os do
// SubscribeButton — o mesmo provider por linha (social-interactions/TD-08) —,
// na caixa `sm` do frame. O primeiro clique desinscreve por `DELETE` e o
// segundo reinscreve por `PUT`: a linha fica na lista até a próxima visita.
function SubscriptionButton(props: SubscriptionButtonProps) {
  return <SubscribeButton size="sm" {...props} />
}

export { SubscriptionButton }
