"use client"

import * as React from "react"
import Link from "next/link"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { initialsOf } from "@/lib/format"
import { cn } from "@/lib/utils"

type UserMenuProps = {
  channelName: string
  nickname: string
  onSignOut?: () => void
  isSigningOut?: boolean
} & Omit<React.ComponentProps<"div">, "children">

// Avatar + "Sair" do chrome autenticado no desktop. O avatar é o "Seu canal"
// da Revision de 2026-10-11 de home-busca/TD-07: um link para a página pública
// do próprio canal, sem dropdown. O logout chega de quem renderiza, pelo
// useLogout.
function UserMenu({
  channelName,
  nickname,
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
      <Link
        href={`/@${nickname}`}
        aria-label="Seu canal"
        className="rounded-[var(--radius-full)] outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Avatar>
          <AvatarFallback>{initialsOf(channelName)}</AvatarFallback>
        </Avatar>
      </Link>

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
