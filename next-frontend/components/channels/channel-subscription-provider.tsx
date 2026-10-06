"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"

import { SubscriberCount } from "@/components/channels/subscriber-count"
import type { SubscriptionState } from "@/lib/api/contracts"
import { buildLoginHref } from "@/lib/auth/return-to"
import { sendMutation } from "@/lib/social/mutation"

type SubscriptionSnapshot = {
  subscribed: boolean
  subscribersCount: number
}

type ChannelSubscriptionContextValue = SubscriptionSnapshot & {
  toggle: () => void
  isPending: boolean
  errorCode: string | null
}

const ChannelSubscriptionContext =
  React.createContext<ChannelSubscriptionContextValue | null>(null)

function toggled(state: SubscriptionSnapshot): SubscriptionSnapshot {
  return {
    subscribed: !state.subscribed,
    subscribersCount: Math.max(
      state.subscribersCount + (state.subscribed ? -1 : 1),
      0
    ),
  }
}

type ChannelSubscriptionProviderProps = {
  nickname: string
  initialSubscribed: boolean
  initialSubscribersCount: number
  isAuthenticated: boolean
  children: React.ReactNode
}

/**
 * Dono do estado de inscrição de um canal, compartilhado entre o botão e a
 * contagem de inscritos, que vivem em pontos diferentes do layout
 * (social-interactions/TD-08 — `useOptimistic` do React 19). O toggle chama
 * `PUT`/`DELETE /api/channels/{nickname}/subscription`; para o anônimo, leva
 * ao login com `returnTo` (social-interactions-anonymous-gate/TD-01 e TD-03).
 */
function ChannelSubscriptionProvider({
  nickname,
  initialSubscribed,
  initialSubscribersCount,
  isAuthenticated,
  children,
}: ChannelSubscriptionProviderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [state, setState] = React.useState<SubscriptionSnapshot>({
    subscribed: initialSubscribed,
    subscribersCount: initialSubscribersCount,
  })
  const [optimistic, setOptimistic] = React.useOptimistic(state, toggled)
  const [isPending, startTransition] = React.useTransition()
  const [errorCode, setErrorCode] = React.useState<string | null>(null)

  const toggle = React.useCallback(() => {
    if (!isAuthenticated) {
      router.push(buildLoginHref(pathname))
      return
    }

    const endpoint = `/api/channels/${encodeURIComponent(nickname)}/subscription`
    const subscribing = !optimistic.subscribed
    setErrorCode(null)

    startTransition(async () => {
      setOptimistic(undefined)
      const outcome = await sendMutation<SubscriptionState>(
        endpoint,
        subscribing ? "PUT" : "DELETE"
      )

      if (outcome.ok) {
        // Depois do await, a atualização precisa de nova transição para trocar
        // o otimista pelo valor real num render só.
        startTransition(() =>
          setState({
            subscribed: outcome.data.subscribed,
            subscribersCount: outcome.data.subscribersCount,
          })
        )
        return
      }

      if (outcome.status === 401) {
        router.push(buildLoginHref(pathname))
        return
      }

      startTransition(() => setErrorCode(outcome.error))
    })
  }, [
    isAuthenticated,
    nickname,
    optimistic.subscribed,
    pathname,
    router,
    setOptimistic,
  ])

  const value = React.useMemo(
    () => ({ ...optimistic, toggle, isPending, errorCode }),
    [optimistic, toggle, isPending, errorCode]
  )

  return (
    <ChannelSubscriptionContext.Provider value={value}>
      {children}
    </ChannelSubscriptionContext.Provider>
  )
}

function useChannelSubscription(): ChannelSubscriptionContextValue {
  const value = React.useContext(ChannelSubscriptionContext)
  if (!value) {
    throw new Error(
      "useChannelSubscription must be used inside <ChannelSubscriptionProvider>"
    )
  }
  return value
}

type ProvidedSubscriberCountProps = Omit<
  React.ComponentProps<typeof SubscriberCount>,
  "count"
>

/** `SubscriberCount` alimentado pelo valor otimista do provider. */
function ProvidedSubscriberCount(props: ProvidedSubscriberCountProps) {
  const { subscribersCount } = useChannelSubscription()
  return <SubscriberCount count={subscribersCount} {...props} />
}

export {
  ChannelSubscriptionProvider,
  ProvidedSubscriberCount,
  useChannelSubscription,
}
