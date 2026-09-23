"use client"

import { Button } from "@/components/ui/button"

export default function PublicChannelError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-12 text-center">
      <h1 className="text-h2 text-foreground">Não foi possível carregar o canal</h1>
      <p className="text-body-md text-muted-foreground">
        Tente de novo em instantes.
      </p>
      <Button type="button" size="md" onClick={reset}>
        Tentar de novo
      </Button>
    </div>
  )
}
