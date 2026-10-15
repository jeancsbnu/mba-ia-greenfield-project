"use client"

import * as React from "react"

import { ChevronDownIcon } from "@/components/icons/chevron-down-icon"
import { cn } from "@/lib/utils"

type VideoDescriptionProps = {
  description: string | null
} & Omit<React.ComponentProps<"section">, "children">

// Caixa de descrição recolhida com alternância. É "use client" porque a
// expansão é estado puramente local — nenhuma ida ao servidor.
//
// O estado expandido NÃO tem desenho no Figma (registrado nas Observations do
// inventário): o frame só mostra a caixa recolhida de 90px com "Mostrar mais".
// Resolvido aqui do jeito menos invasivo possível — a caixa cresce no fluxo e
// empurra o que vem abaixo dela, sem scroll próprio e sem deslocar a sidebar,
// que é coluna irmã. Se o desenho aparecer e contradisser, é aqui que muda.
function VideoDescription({
  description,
  className,
  ...props
}: VideoDescriptionProps) {
  const [expanded, setExpanded] = React.useState(false)
  const [overflows, setOverflows] = React.useState(false)
  const textRef = React.useRef<HTMLParagraphElement>(null)
  const regionId = React.useId()

  // "Mostrar mais" só quando o texto recolhido passa das duas linhas: numa
  // descrição curta o botão não teria nada a revelar. Mede com o clamp
  // aplicado e de novo quando a largura muda (o texto quebra diferente).
  React.useEffect(() => {
    const text = textRef.current
    if (!text || expanded) return

    const measure = () => setOverflows(text.scrollHeight > text.clientHeight)
    measure()
    if (typeof ResizeObserver === "undefined") return

    const observer = new ResizeObserver(measure)
    observer.observe(text)
    return () => observer.disconnect()
  }, [description, expanded])

  if (description === null || description.trim() === "") {
    return null
  }

  return (
    <section
      data-slot="video-description"
      className={cn(
        "flex flex-col gap-2 rounded-[var(--radius-3)] border border-border bg-card p-4",
        className
      )}
      {...props}
    >
      <p
        ref={textRef}
        id={regionId}
        data-slot="video-description-text"
        className={cn(
          "text-body-md whitespace-pre-line text-foreground",
          expanded ? undefined : "line-clamp-2"
        )}
      >
        {description}
      </p>

      {overflows || expanded ? (
        <button
          type="button"
          data-slot="video-description-toggle"
          aria-expanded={expanded}
          aria-controls={regionId}
          onClick={() => {
            setExpanded((previous) => !previous)
          }}
          className="inline-flex w-fit items-center gap-1.5 text-label-md text-link outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {expanded ? "Mostrar menos" : "Mostrar mais"}
          <ChevronDownIcon
            className={cn("size-3 transition-transform", expanded && "rotate-180")}
          />
        </button>
      ) : null}
    </section>
  )
}

export { VideoDescription }
