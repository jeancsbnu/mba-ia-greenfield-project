"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { BrandLogo } from "@/components/auth/brand-logo"
import { cn } from "@/lib/utils"

const SUBSCRIPTIONS_ROUTE = "/channel/subscriptions"

type SiteNavbarProps = {
  /** Mostra o link "Canais seguidos" — só no chrome autenticado. */
  showSubscriptionsLink?: boolean
} & React.ComponentProps<"header">

// Chrome compartilhado. O navbar completo (busca, variante autenticada rica) é
// escopo da Fase 07. O lado direito é um slot — UserMenu no chrome autenticado,
// botão "Entrar" no anônimo. O link "Canais seguidos" é o ponto de entrada da
// área exigido pelo social-interactions/TD-07, escrito inline aqui por decisão
// do inventário da Fase 06; é "use client" só para marcar a rota ativa.
function SiteNavbar({
  showSubscriptionsLink = false,
  className,
  children,
  ...props
}: SiteNavbarProps) {
  const pathname = usePathname()

  return (
    <header
      data-slot="site-navbar"
      className={cn(
        "flex w-full items-center justify-between gap-4 border-b border-border px-12 py-5",
        className
      )}
      {...props}
    >
      <Link href="/" aria-label="StreamTube">
        <BrandLogo size="md" />
      </Link>

      <div className="flex items-center gap-6">
        {showSubscriptionsLink ? (
          <Link
            href={SUBSCRIPTIONS_ROUTE}
            aria-current={pathname === SUBSCRIPTIONS_ROUTE ? "page" : undefined}
            className="text-label-md text-foreground hover:underline aria-[current=page]:underline"
          >
            Canais seguidos
          </Link>
        ) : null}
        {children}
      </div>
    </header>
  )
}

export { SiteNavbar }
