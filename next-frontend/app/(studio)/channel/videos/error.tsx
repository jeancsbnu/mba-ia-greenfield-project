"use client"

import { Button } from "@/components/ui/button"

// error.tsx precisa ser Client Component: o `reset` do Next é uma função
// passada ao componente, e o boundary roda no cliente.
export default function ChannelVideosError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-4 px-12 py-24 text-center">
      <h1 className="text-h2 text-foreground">
        Não foi possível carregar seus vídeos
      </h1>
      <p className="text-body-md text-muted-foreground">
        Algo deu errado do nosso lado. Tente de novo em instantes.
      </p>
      <Button type="button" size="md" onClick={reset}>
        Tentar de novo
      </Button>
    </div>
  )
}
