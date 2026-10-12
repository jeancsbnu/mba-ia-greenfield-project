"use client"

import * as React from "react"
import Link from "next/link"

import { MenuIcon } from "@/components/icons/menu-icon"
import { XIcon } from "@/components/icons/x-icon"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { IconButton } from "@/components/ui/icon-button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { initialsOf } from "@/lib/format"
import { cn } from "@/lib/utils"

type NavigationSheetViewer = {
  name: string
  nickname: string
}

type NavigationSheetProps = {
  viewer: NavigationSheetViewer | null
  pathname: string
  onSignOut: () => void
  isSigningOut?: boolean
  className?: string
}

type NavLink = { href: string; label: string; private: boolean }

// Destinos do chrome (home-busca/TD-07, Revision de 2026-10-11): as rotas do
// studio só aparecem com sessão.
const NAV_LINKS: NavLink[] = [
  { href: "/", label: "Início", private: false },
  { href: "/channel/subscriptions", label: "Canais seguidos", private: true },
  { href: "/channel/videos", label: "Meus vídeos", private: true },
]

// Menu de navegação do mobile: painel lateral de 288px sobre o Sheet do
// shadcn, que traz overlay, foco preso, Esc e toque fora. Não lê dados — a
// identidade vem do PublicSiteNavbar e o logout de quem a renderiza.
function NavigationSheet({
  viewer,
  pathname,
  onSignOut,
  isSigningOut = false,
  className,
}: NavigationSheetProps) {
  const links = NAV_LINKS.filter((link) => viewer || !link.private)

  return (
    <Sheet>
      <SheetTrigger asChild>
        <IconButton aria-label="Abrir menu" size="lg" className={className}>
          <MenuIcon />
        </IconButton>
      </SheetTrigger>

      <SheetContent
        side="right"
        showCloseButton={false}
        aria-describedby={undefined}
        className="w-72 gap-0 p-0 sm:max-w-72"
      >
        <div className="flex items-center justify-between px-4 py-3">
          <SheetTitle className="text-label-lg text-foreground">Menu</SheetTitle>
          <SheetClose asChild>
            <IconButton aria-label="Fechar menu" size="lg">
              <XIcon />
            </IconButton>
          </SheetClose>
        </div>

        <div className="px-4 pb-4">
          {viewer ? (
            <SheetClose asChild>
              <Link
                href={`/@${viewer.nickname}`}
                data-slot="navigation-sheet-user"
                className="flex items-center gap-3 rounded-[var(--radius-2)] outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <Avatar size="lg">
                  <AvatarFallback>{initialsOf(viewer.name)}</AvatarFallback>
                </Avatar>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-label-md text-foreground">
                    {viewer.name}
                  </span>
                  <span className="truncate text-caption text-muted-foreground">
                    @{viewer.nickname}
                  </span>
                </span>
              </Link>
            </SheetClose>
          ) : (
            <Button asChild variant="secondary">
              <Link href="/login">Entrar</Link>
            </Button>
          )}
        </div>

        <hr className="mx-4 border-border" />

        <nav aria-label="Menu de navegação" className="flex flex-col gap-1 px-4 py-2">
          {links.map((link) => {
            const current = pathname === link.href
            return (
              <SheetClose asChild key={link.href}>
                <Link
                  href={link.href}
                  aria-current={current ? "page" : undefined}
                  className={cn(
                    "rounded-[var(--radius-2)] px-3 py-2.5 text-label-md text-foreground outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50",
                    "aria-[current=page]:bg-muted aria-[current=page]:text-link"
                  )}
                >
                  {link.label}
                </Link>
              </SheetClose>
            )
          })}
        </nav>

        {viewer ? (
          <>
            <hr className="mx-4 border-border" />
            <div className="p-4">
              <Button
                type="button"
                variant="outline"
                disabled={isSigningOut}
                onClick={onSignOut}
              >
                Sair
              </Button>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

export { NavigationSheet }
export type { NavigationSheetViewer }
