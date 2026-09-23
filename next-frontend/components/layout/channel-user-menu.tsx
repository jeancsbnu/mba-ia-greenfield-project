"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { UserMenu } from "@/components/layout/user-menu"

type ChannelUserMenuProps = {
  channelName: string
}

// Casca cliente do UserMenu: o layout é Server Component e não pode passar
// função como prop, então a chamada ao logout mora aqui. Mesmo critério dos
// formulários da Fase 02, em que o componente cliente é dono do próprio fetch.
function ChannelUserMenu({ channelName }: ChannelUserMenuProps) {
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = React.useState(false)

  async function handleSignOut() {
    setIsSigningOut(true)
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/login")
      // O layout lê /me/channel a cada requisição; sem refresh a árvore em
      // cache ainda traria o canal do usuário que acabou de sair.
      router.refresh()
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <UserMenu
      channelName={channelName}
      onSignOut={() => void handleSignOut()}
      isSigningOut={isSigningOut}
    />
  )
}

export { ChannelUserMenu }
