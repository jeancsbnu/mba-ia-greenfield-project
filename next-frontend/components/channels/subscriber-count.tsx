import * as React from "react"

import { cn } from "@/lib/utils"

// Forma abreviada pt-BR do design ("1,2 mil inscritos"). Uma casa decimal é o
// que o Figma mostra; acima disso o número perde a leitura rápida.
const compactFormatter = new Intl.NumberFormat("pt-BR", {
  notation: "compact",
  maximumFractionDigits: 1,
})

function subscribersLabel(count: number): string {
  return count === 1
    ? "1 inscrito"
    : `${compactFormatter.format(count)} inscritos`
}

type SubscriberCountProps = {
  count: number
} & Omit<React.ComponentProps<"span">, "children">

// Contagem de inscritos compartilhada pela watch page, pela página do canal e
// pela área de canais seguidos (OQ-16). Não faz I/O nem guarda estado: quem
// passa o valor — inclusive o otimista do clique em "Inscrever-se" — é o
// provider da inscrição (social-interactions/TD-08). O aria-live é o anúncio
// da mudança de contagem para leitor de tela.
function SubscriberCount({ count, className, ...props }: SubscriberCountProps) {
  return (
    <span
      data-slot="subscriber-count"
      aria-live="polite"
      className={cn(className)}
      {...props}
    >
      {subscribersLabel(count)}
    </span>
  )
}

export { SubscriberCount }
