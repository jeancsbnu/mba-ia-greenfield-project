"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

// Logout compartilhado pelo "Sair" da navbar e pelo da NavigationSheet
// (home-busca/TD-07, Revision de 2026-10-11). A resposta não é checada: o BFF
// apaga o cookie mesmo quando o upstream falha (phase-02-auth-frontend/TD-05).
function useLogout() {
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = React.useState(false)

  const signOut = React.useCallback(async () => {
    setIsSigningOut(true)
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/login")
      // A navbar lê /me/channel a cada requisição; sem refresh a árvore em
      // cache ainda traria o canal do usuário que acabou de sair.
      router.refresh()
    } finally {
      setIsSigningOut(false)
    }
  }, [router])

  return { signOut, isSigningOut }
}

export { useLogout }
