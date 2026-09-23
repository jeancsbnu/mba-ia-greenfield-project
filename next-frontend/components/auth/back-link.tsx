import * as React from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"

type BackLinkProps = {
  href: string
  className?: string
  /** Ícone decorativo à esquerda do texto. Sem ele a saída não muda. */
  icon?: React.ReactNode
  children?: React.ReactNode
}

function BackLink({
  href,
  className,
  icon,
  children = "Voltar",
}: BackLinkProps) {
  return (
    <Link
      href={href}
      data-slot="back-link"
      className={cn(
        "inline-flex items-center gap-1 text-body-md text-muted-foreground",
        "hover:text-foreground transition-colors",
        "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 rounded-[var(--radius-0-5)]",
        className
      )}
    >
      {icon ? (
        // aria-hidden aqui, e não só no componente de ícone: o nome acessível
        // do link tem de vir apenas do texto, independentemente do que o
        // chamador passar.
        <span aria-hidden="true" data-slot="back-link-icon">
          {icon}
        </span>
      ) : null}
      {children}
    </Link>
  )
}

export { BackLink }
