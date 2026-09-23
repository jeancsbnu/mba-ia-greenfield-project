import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function VideoEditNotFound() {
  return (
    <div className="flex flex-col items-center gap-4 px-12 py-24 text-center">
      <h1 className="text-h2 text-foreground">Vídeo não encontrado</h1>
      <p className="text-body-md text-muted-foreground">
        Ele pode ter sido removido, ou não pertence ao seu canal.
      </p>
      <Button asChild size="md">
        <Link href="/channel/videos">Voltar para o painel</Link>
      </Button>
    </div>
  )
}
