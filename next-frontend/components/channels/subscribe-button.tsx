"use client"

import * as React from "react"

import { useChannelSubscription } from "@/components/channels/channel-subscription-provider"
import { Button } from "@/components/ui/button"

type SubscribeButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  "children" | "onClick" | "aria-pressed"
>

// Tratamento por código de erro (§UI Contracts das duas telas). UNAUTHORIZED
// não chega aqui: o provider leva ao login.
const ERROR_MESSAGES: Record<string, string> = {
  RATE_LIMIT_EXCEEDED:
    "Muitas ações em pouco tempo. Tente de novo em instantes.",
  CHANNEL_NOT_FOUND: "Este canal não está mais disponível.",
}
const FALLBACK_ERROR = "Não foi possível atualizar sua inscrição."

// "Inscrever-se" / "Inscrito" (Figma `subscribe-button` 77:119 e 79:82) — um
// componente para a watch page e a página do canal. O estado e a mutação vêm
// do ChannelSubscriptionProvider (social-interactions/TD-08); o estado
// "Inscrito" não tem desenho e usa a variante sem preenchimento (OQ-13).
function SubscribeButton(props: SubscribeButtonProps) {
  const { subscribed, toggle, errorCode } = useChannelSubscription()

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <Button
        type="button"
        variant={subscribed ? "secondary" : "default"}
        data-slot="subscribe-button"
        aria-pressed={subscribed}
        onClick={toggle}
        {...props}
      >
        {subscribed ? "Inscrito" : "Inscrever-se"}
      </Button>
      {errorCode ? (
        <span
          role="alert"
          data-slot="subscription-error"
          className="text-caption text-destructive"
        >
          {ERROR_MESSAGES[errorCode] ?? FALLBACK_ERROR}
        </span>
      ) : null}
    </span>
  )
}

export { SubscribeButton }
