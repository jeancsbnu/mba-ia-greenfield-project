"use client"

import * as React from "react"

import { ChannelAvatar } from "@/components/channels/channel-avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { bumpAvatarVersion } from "@/lib/channels/avatar-version"
import { cn } from "@/lib/utils"

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_BYTES = 2 * 1024 * 1024

type ChannelAvatarUploaderProps = {
  nickname: string
  name: string
} & Omit<React.ComponentProps<"div">, "children">

// Foto de perfil do canal na tela "Editar canal". Troca e remoção são
// imediatas (não esperam o "Salvar" do formulário): cada ação é um PUT/DELETE
// próprio, e a versão da foto (lib/channels/avatar-version) atualiza todos os
// avatares do canal na página.
function ChannelAvatarUploader({
  nickname,
  name,
  className,
  ...props
}: ChannelAvatarUploaderProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function send(init: RequestInit) {
    setPending(true)
    setError(null)
    try {
      const res = await fetch("/api/me/channel/avatar", init)
      if (!res.ok) {
        setError(
          res.status === 400 || res.status === 413
            ? "Use uma imagem JPEG, PNG ou WebP de até 2 MB."
            : "Não foi possível salvar a foto. Tente de novo."
        )
        return
      }
      // Navbar, menu e este seletor buscam a foto nova juntos.
      bumpAvatarVersion(nickname)
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
      <ChannelAvatar size="xl" nickname={nickname} name={name} />

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
