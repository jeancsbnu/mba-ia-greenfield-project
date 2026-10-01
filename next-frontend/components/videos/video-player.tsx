"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Fachada de mídia injetável (per video-watch-page/TD-06, Option A).
 *
 * O gatilho da contagem depende de tempo de mídia avançado; sem esta
 * indireção o teste precisaria de um `<video>` real reproduzindo em tempo
 * real para afirmar "logo abaixo do limiar não chama, logo acima chama uma
 * vez só". É um ponto fino de indireção de propósito — se começar a crescer
 * para play/pause/volume, a decisão está sendo mal aplicada: os controles são
 * do navegador (TD-01).
 */
export type MediaTimeSource = {
  /** Inscreve um ouvinte do tempo corrente da mídia. Devolve o cancelamento. */
  subscribe: (listener: (currentTime: number) => void) => () => void
}

/** Limiar de reprodução efetiva que dispara a contagem (TD-03). */
export const VIEW_THRESHOLD_SECONDS = 5

// Um `timeupdate` dispara a cada ~250 ms. Um salto maior que isto é busca na
// barra de progresso, não reprodução — contá-lo transformaria "arrastar até o
// fim" numa visualização.
const MAX_PLAYBACK_DELTA_SECONDS = 1

function domTimeSource(element: HTMLVideoElement): MediaTimeSource {
  return {
    subscribe(listener) {
      const handler = () => {
        listener(element.currentTime)
      }
      element.addEventListener("timeupdate", handler)
      return () => {
        element.removeEventListener("timeupdate", handler)
      }
    },
  }
}

type VideoPlayerProps = {
  /** URL pré-assinada de 6 h, entregue junto com a página. */
  src: string
  /** Usado como rótulo acessível; o player não exibe o título. */
  title: string
  /** Identifica o vídeo na chamada de contagem. */
  publicId: string
  /** Injetável no teste, para afirmar o limiar sem relógio real. */
  timeSource?: (element: HTMLVideoElement) => MediaTimeSource
} & Omit<React.ComponentProps<"div">, "children" | "title">

// `<video controls>` nativo, por video-watch-page/TD-01: play/pause, volume e
// progresso são do navegador e NÃO são reimplementados. Os sete nós de
// controle do frame (`67:45`–`67:55`) são ilustrativos; a parity visual não se
// aplica a essa faixa, que muda de aparência entre navegadores por construção.
//
// É "use client" porque o disparo da contagem depende do evento `timeupdate`
// do elemento (TD-03) — a fronteira de cliente existe por isso, não por estilo.
function VideoPlayer({
  src,
  title,
  publicId,
  timeSource = domTimeSource,
  className,
  ...props
}: VideoPlayerProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null)

  React.useEffect(() => {
    const element = videoRef.current
    if (element === null) return

    // Tempo de mídia AVANÇADO, não tempo de página aberta: somamos os deltas
    // para frente do `currentTime`, de modo que pausar, buscar ou deixar a aba
    // em segundo plano não acumulem nada.
    let watched = 0
    let lastTime: number | null = null
    // Uma vez por montagem: o gatilho não rearma ao voltar o vídeo ao início.
    let registered = false

    const unsubscribe = timeSource(element).subscribe((currentTime) => {
      if (lastTime !== null) {
        const delta = currentTime - lastTime
        if (delta > 0 && delta <= MAX_PLAYBACK_DELTA_SECONDS) {
          watched += delta
        }
      }
      lastTime = currentTime

      if (registered || watched < VIEW_THRESHOLD_SECONDS) return
      registered = true

      // A contagem é métrica, não função da página: qualquer falha — inclusive
      // o 429 do orçamento da rota — é silenciosa para o espectador (TD-05).
      void fetch(`/api/videos/${publicId}/view`, { method: "POST" }).catch(
        () => undefined
      )
    })

    return unsubscribe
  }, [publicId, timeSource])

  return (
    <div
      data-slot="video-player"
      className={cn(
        "w-full overflow-hidden rounded-[var(--radius-3)] bg-foreground",
        className
      )}
      {...props}
    >
      <video
        ref={videoRef}
        data-slot="video-player-element"
        className="aspect-video w-full"
        src={src}
        controls
        preload="metadata"
        playsInline
        aria-label={title}
      />
    </div>
  )
}

export { VideoPlayer }
