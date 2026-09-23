"use client"

import * as React from "react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type UserMenuProps = {
  channelName: string
  onSignOut?: () => void
  isSigningOut?: boolean
} & Omit<React.ComponentProps<"div">, "children">

// Iniciais do canal: não há upload de avatar nesta fase (OQ-21).
function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return "?"
  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
}

// Avatar + "Sair" como uma unidade: é o componente dono da ação de logout,
// mesmo critério de Form + SubmitButton da Fase 02. A chamada ao
// POST /api/auth/logout é injetada por quem renderiza (SI-04.10).
function UserMenu({
  channelName,
  onSignOut,
  isSigningOut = false,
  className,
  ...props
}: UserMenuProps) {
  return (
    <div
      data-slot="user-menu"
      className={cn("flex items-center gap-4", className)}
      {...props}
    >
      <Avatar aria-label={channelName}>
        <AvatarFallback>{initialsOf(channelName)}</AvatarFallback>
      </Avatar>

      <Button
        type="button"
        variant="outline"
        onClick={onSignOut}
        disabled={isSigningOut}
      >
        Sair
      </Button>
    </div>
  )
}

export { UserMenu }
