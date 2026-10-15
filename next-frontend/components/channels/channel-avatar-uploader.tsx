"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { ChannelAvatar } from "@/components/channels/channel-avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { ApiErrorEnvelope } from "@/lib/api/contracts"
import { cn } from "@/lib/utils"

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_BYTES = 2 * 1024 * 1024

type ChannelAvatarUploaderProps = {
  nickname: string
  name: string
} & Omit<React.ComponentProps<"div">, "children">

// Foto de perfil do canal na tela "Editar canal". Troca e remoção são
// imediatas (não esperam o "Salvar" do formulário): cada ação é um PUT/DELETE
// próprio. A versão muda a URL da imagem para não mostrar a foto anterior.
function ChannelAvatarUploader({
  nickname,
  name,
  className,
  ...props
}: ChannelAvatarUploaderProps) {
  const router = useRouter()
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [version, setVersion] = React.useState(() => Date.now())
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function send(init: RequestInit) {
    setPending(true)
    setError(null)
    try {
      const res = await fetch("/api/me/channel/avatar", init)
      if (!res.ok) {
        const envelope = (await res.json().catch(() => null)) as
          | ApiErrorEnvelope
          | null
        setError(
          res.status === 400 || res.status === 413
            ? "Use uma imagem JPEG, PNG ou WebP de até 2 MB."
            : (envelope?.statusCode && "Não foi possível salvar a foto. Tente de novo.") ||
                "Não foi possível salvar a foto. Tente de novo."
        )
        return
      }
      setVersion(Date.now())
      // A navbar e o menu também mostram a foto: re-renderiza o chrome.
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    if (!ACCEPTED_TYPES.includes(file.type) || file.size > MAX_BYTES) {
      setError("Use uma imagem JPEG, PNG ou WebP de até 2 MB.")
      return
    }

    const form = new FormData()
    form.append("avatar", file)
    void send({ method: "PUT", body: form })
  }

  return (
    <Card
      data-slot="channel-avatar-uploader"
      className={cn("w-full max-w-xl flex-row items-center gap-4 px-6 py-6", className)}
      {...props}
    >
      <ChannelAvatar size="xl" nickname={nickname} name={name} version={version} />

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="text-label-lg text-foreground">Foto do canal</span>
        <span className="text-caption text-muted-foreground">
          JPEG, PNG ou WebP, até 2 MB.
        </span>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="md"
            disabled={pending}
            onClick={() => inputRef.current?.click()}
          >
            {pending ? "Salvando…" : "Alterar foto"}
          </Button>
          <Button
            type="button"
            size="md"
            variant="outline"
            disabled={pending}
            onClick={() => void send({ method: "DELETE" })}
          >
            Remover foto
          </Button>
        </div>
        {error ? (
          <p role="alert" className="text-caption text-destructive">
            {error}
          </p>
        ) : null}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          aria-label="Arquivo da foto do canal"
          className="sr-only"
          tabIndex={-1}
          onChange={handleFile}
        />
      </div>
    </Card>
  )
}

export { ChannelAvatarUploader }
