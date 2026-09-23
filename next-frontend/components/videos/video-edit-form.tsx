"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { FieldError } from "@/components/auth/field-error"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { ApiErrorEnvelope } from "@/lib/api/contracts"
import {
  THUMBNAIL_ERROR_MESSAGES,
  VIDEO_CATEGORIES,
  validateThumbnail,
  videoEditSchema,
  type VideoEditValues,
} from "@/lib/videos/edit-schema"
import { cn } from "@/lib/utils"

type Intent = "save" | "publish" | "unpublish"

type VideoEditFormProps = {
  publicId: string
  defaultValues: VideoEditValues
  /** `true` quando o vídeo já foi publicado (published_at não nulo). */
  isPublished?: boolean
  /** Publicar exige status = ready (TD-02). */
  canPublish?: boolean
  /** Arquivo escolhido no uploader; enviado junto do submit (TD-03). */
  thumbnailFile?: File | null
  /** Erro de thumbnail exibido sob o uploader, fora deste formulário. */
  onThumbnailError?: (message: string | null) => void
} & Omit<React.ComponentProps<"form">, "defaultValue" | "onSubmit">

function VideoEditForm({
  publicId,
  defaultValues,
  isPublished = false,
  canPublish = true,
  thumbnailFile = null,
  onThumbnailError,
  className,
  children,
  ...props
}: VideoEditFormProps) {
  const router = useRouter()
  const [formError, setFormError] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<VideoEditValues>({
    resolver: zodResolver(videoEditSchema),
    defaultValues,
  })

  // O intent vem do botão que submeteu; guardamos numa ref porque o evento de
  // submit não sobrevive ao await do handler.
  const intentRef = React.useRef<Intent>("save")

  async function onSubmit(values: VideoEditValues) {
    setFormError(null)
    setSuccessMessage(null)

    const thumbnailProblem = validateThumbnail(thumbnailFile)
    if (thumbnailProblem) {
      onThumbnailError?.(THUMBNAIL_ERROR_MESSAGES[thumbnailProblem])
      return
    }
    onThumbnailError?.(null)

    const body = new FormData()
    body.set("title", values.title)
    body.set("description", values.description)
    body.set("category", values.category)
    body.set("visibility", values.visibility)

    // "Salvar" não manda `published`: omitir preserva o estado atual, enquanto
    // enviar false despublicaria sem o usuário ter pedido (TD-02).
    if (intentRef.current === "publish") body.set("published", "true")
    if (intentRef.current === "unpublish") body.set("published", "false")

    if (thumbnailFile) body.set("thumbnail", thumbnailFile)

    const response = await fetch(`/api/videos/${publicId}`, {
      method: "PATCH",
      body,
    })

    if (response.ok) {
      setSuccessMessage(
        intentRef.current === "publish"
          ? "Vídeo publicado."
          : intentRef.current === "unpublish"
            ? "Vídeo despublicado."
            : "Alterações salvas."
      )
      router.refresh()
      return
    }

    const envelope = (await response.json()) as ApiErrorEnvelope

    if (response.status === 401) {
      router.push("/login")
      return
    }

    if (envelope.error === "FORBIDDEN" || envelope.error === "VIDEO_NOT_FOUND") {
      // O vídeo não é (mais) deste canal: cair no not-found evita revelar que
      // ele existe em outro lugar.
      router.replace(`/videos/${publicId}/edit/not-found`)
      return
    }

    if (response.status === 400 || response.status === 413) {
      onThumbnailError?.(
        typeof envelope.message === "string"
          ? envelope.message
          : envelope.message.join(" ")
      )
      return
    }

    setFormError(
      typeof envelope.message === "string"
        ? envelope.message
        : envelope.message.join(" ")
    )
  }

  function submitWith(intent: Intent) {
    intentRef.current = intent
  }

  const visibility = watch("visibility")

  return (
    <form
      data-slot="video-edit-form"
      className={cn("flex w-full flex-col gap-6", className)}
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      {...props}
    >
      <h2 className="text-label-lg uppercase text-foreground">
        Detalhes do vídeo
      </h2>

      <div className="flex flex-col gap-2">
        <Label htmlFor="video-title" className="uppercase">
          Título
        </Label>
        <Input
          id="video-title"
          aria-invalid={errors.title ? true : undefined}
          {...register("title")}
        />
        <FieldError message={errors.title?.message} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="video-description" className="uppercase">
          Descrição
        </Label>
        <Textarea
          id="video-description"
          className="min-h-30"
          aria-invalid={errors.description ? true : undefined}
          {...register("description")}
        />
        <FieldError message={errors.description?.message} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="video-category" className="uppercase">
          Categoria
        </Label>
        <Select
          value={watch("category")}
          onValueChange={(value) =>
            setValue("category", value as VideoEditValues["category"], {
              shouldValidate: true,
            })
          }
        >
          <SelectTrigger id="video-category" className="w-full">
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {VIDEO_CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError message={errors.category?.message} />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-label-md uppercase text-foreground">
          Visibilidade
        </legend>
        <RadioGroup
          value={visibility}
          onValueChange={(value) =>
            setValue("visibility", value as VideoEditValues["visibility"], {
              shouldValidate: true,
            })
          }
          aria-label="Visibilidade"
          className="flex flex-row gap-6"
        >
          <Label className="flex items-center gap-2">
            <RadioGroupItem value="public" />
            Público
          </Label>
          <Label className="flex items-center gap-2">
            {/* "Indisponível" é o rótulo de `unlisted` na UI (TD-02, revisão 2026-08-08). */}
            <RadioGroupItem value="unlisted" />
            Indisponível
          </Label>
        </RadioGroup>
      </fieldset>

      <div className="flex items-center gap-4">
        <Button
          type="submit"
          variant="outline"
          disabled={isSubmitting}
          onClick={() => {
            submitWith("save")
          }}
        >
          {isPublished ? "Salvar alterações" : "Salvar rascunho"}
        </Button>

        {isPublished ? (
          <Button
            type="submit"
            disabled={isSubmitting}
            onClick={() => {
              submitWith("unpublish")
            }}
          >
            Despublicar
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={isSubmitting || !canPublish}
            aria-describedby={canPublish ? undefined : "publish-blocked"}
            onClick={() => {
              submitWith("publish")
            }}
          >
            Publicar
          </Button>
        )}

        {children}
      </div>

      {!isPublished && !canPublish ? (
        <p id="publish-blocked" className="text-helper text-muted-foreground">
          A publicação fica disponível quando o processamento do vídeo terminar.
        </p>
      ) : null}

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
  )
}

export { VideoEditForm }
