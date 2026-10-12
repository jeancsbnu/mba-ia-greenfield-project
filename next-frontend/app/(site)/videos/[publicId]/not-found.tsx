import Link from "next/link"

import { VideoOffIcon } from "@/components/icons/video-off-icon"
import { SiteNavbar } from "@/components/layout/site-navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

// Renderizada pelo notFound() do segmento pai. Sem estado e sem I/O próprio:
// é um Server Component passivo, por isso não tem SI-Xb (Decisão #33).
export default function VideoNotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteNavbar>
        <Button asChild variant="secondary">
          <Link href="/login">Entrar</Link>
        </Button>
      </SiteNavbar>

      <main className="flex flex-1 items-center justify-center px-12 py-24">
        <Card size="lg" className="w-full max-w-[520px]">
          <CardContent className="flex flex-col items-center gap-5 text-center">
            <span
              aria-hidden="true"
              className="flex size-16 items-center justify-center rounded-[var(--radius-full)] bg-secondary"
            >
              <VideoOffIcon className="size-7 text-muted-foreground" />
            </span>

            <h1 className="text-h1 text-foreground">VÍDEO NÃO ENCONTRADO</h1>

            {/* Este texto é regra de segurança, não copy. Por
                video-channel-management/TD-09, o vídeo inexistente e o
                rascunho de outro canal têm de ser indistinguíveis: dizer
                "não existe" revelaria, por contraste, que o outro existe.
                As três causas ficam cobertas sem apontar qual se aplica.
                Não criar variante por causa. */}
            <p className="text-body-md text-muted-foreground">
              Este vídeo não existe, foi removido, ou ainda não foi publicado.
            </p>

            <Button asChild variant="secondary">
              <Link href="/">Voltar para o início</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
