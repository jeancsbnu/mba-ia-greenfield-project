"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { FieldError } from "@/components/auth/field-error"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { ApiErrorEnvelope } from "@/lib/api/contracts"
import {
  channelEditSchema,
  type ChannelEditValues,
} from "@/lib/channels/edit-schema"
import { cn } from "@/lib/utils"

type ChannelEditFormProps = {
  defaultValues: ChannelEditValues
} & Omit<React.ComponentProps<"form">, "defaultValue" | "onSubmit">

const NICKNAME_HELPER_ID = "channel-nickname-helper"
const NICKNAME_URL_WARNING_ID = "channel-nickname-url-warning"

function ChannelEditForm({
  defaultValues,
  className,
  children,
  ...props
}: ChannelEditFormProps) {
  const router = useRouter()
  const [formError, setFormError] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ChannelEditValues>({
    resolver: zodResolver(channelEditSchema),
    defaultValues,
  })

  async function onSubmit(values: ChannelEditValues) {
    setFormError(null)
    setSuccessMessage(null)

    const response = await fetch("/api/me/channel", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })

    if (response.ok) {
      setSuccessMessage("Alterações salvas")
      // O layout (studio) lê GET /me/channel a cada requisição; sem refresh a
      // navbar seguiria mostrando o nome antigo do canal.
      router.refresh()
      return
    }

    const envelope = (await response.json()) as ApiErrorEnvelope

    if (response.status === 401) {
      router.push("/login")
      return
    }

    if (envelope.error === "NICKNAME_ALREADY_EXISTS") {
      setError("nickname", {
        message: "Esse nickname já pertence a outro canal",
      })
      return
    }

    if (envelope.error === "CHANNEL_NOT_FOUND") {
      router.replace("/channel/settings/not-found")
      return
    }

    setFormError(
      typeof envelope.message === "string"
        ? envelope.message
        : envelope.message.join(" ")
    )
  }

  return (
    <Card
      className={cn("flex w-full max-w-[520px] flex-col gap-6 p-8", className)}
    >
      <h1 className="text-h3 uppercase">Editar canal</h1>

      <form
        data-slot="channel-edit-form"
        className="flex flex-col gap-6"
        onSubmit={(event) => void handleSubmit(onSubmit)(event)}
        {...props}
      >
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="channel-nickname" className="uppercase">
              Nickname
            </Label>
            {/* O Input do DS não tem variante com prefixo, então a borda é
                desenhada por este wrapper e removida do campo — assim o "@" e o
                texto ficam numa caixa só, como o design mostra, e o foco ainda
                aparece porque o anel é herdado via focus-within. */}
            <div className="flex w-full items-center gap-1 rounded-[var(--radius-2)] border border-border bg-input-background px-4 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
              <span
                aria-hidden="true"
                className="text-body-lg text-muted-foreground"
              >
                @
              </span>
              <Input
                id="channel-nickname"
                aria-invalid={errors.nickname ? true : undefined}
                aria-describedby={`${NICKNAME_HELPER_ID} ${NICKNAME_URL_WARNING_ID}`}
                className="border-0 bg-transparent px-0 focus-visible:border-0 focus-visible:ring-0"
                {...register("nickname")}
              />
            </div>
            <FieldError message={errors.nickname?.message} />
            <p
              id={NICKNAME_HELPER_ID}
              className="text-helper text-muted-foreground"
            >
              Único e global para o sistema
            </p>
            <p
              id={NICKNAME_URL_WARNING_ID}
              className="text-helper text-muted-foreground"
            >
              Alterar o nickname muda o endereço público do canal
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="channel-name" className="uppercase">
              Nome do canal
            </Label>
            <Input
              id="channel-name"
              aria-invalid={errors.name ? true : undefined}
              {...register("name")}
            />
            <FieldError message={errors.name?.message} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="channel-description" className="uppercase">
              Descrição
            </Label>
            <Textarea
              id="channel-description"
              className="min-h-25"
              aria-invalid={errors.description ? true : undefined}
              {...register("description")}
            />
            <FieldError message={errors.description?.message} />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={isSubmitting}>
            Salvar alterações
          </Button>
          {children}
        </div>

        {successMessage ? (
          <p role="status" className="text-helper text-success-text">
            {successMessage}
          </p>
        ) : null}

        {formError ? (
          <p role="alert" className="text-helper text-destructive">
            {formError}
          </p>
        ) : null}
      </form>
    </Card>
  )
}

export { ChannelEditForm }
