import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function PublicChannelNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-12 text-center">
      <h1 className="text-h2 text-foreground">Canal não encontrado</h1>
      <p className="text-body-md text-muted-foreground">
        Confira o endereço — esse canal pode ter mudado de nickname.
      </p>
      <Button asChild size="md">
        <Link href="/">Ir para a página inicial</Link>
      </Button>
    </div>
  )
}
