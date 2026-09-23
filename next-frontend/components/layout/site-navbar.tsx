import * as React from "react"
import Link from "next/link"

import { BrandLogo } from "@/components/auth/brand-logo"
import { cn } from "@/lib/utils"

type SiteNavbarProps = React.ComponentProps<"header">

// Chrome compartilhado das telas da Fase 04. Sem busca nem links extras: o navbar
// completo (busca, variante autenticada rica) é escopo da Fase 07. O lado direito
// é um slot — UserMenu no layout autenticado, botão "Entrar" na página pública.
function SiteNavbar({ className, children, ...props }: SiteNavbarProps) {
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

      {children}
    </header>
  )
}

export { SiteNavbar }
