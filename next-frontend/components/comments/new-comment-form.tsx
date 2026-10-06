"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { Comment } from "@/lib/api/contracts"
import { buildLoginHref } from "@/lib/auth/return-to"
import { initialsOf } from "@/lib/format"
import type { MutationOutcome } from "@/lib/social/mutation"
import { cn } from "@/lib/utils"

/** Espelho das Validation Rules do backend: aparado, 1 a 2000 caracteres. */
export const COMMENT_BODY_MAX_LENGTH = 2000

const commentSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Escreva um comentário")
    .max(
      COMMENT_BODY_MAX_LENGTH,
      `Use no máximo ${COMMENT_BODY_MAX_LENGTH} caracteres`
    ),
})

type CommentValues = z.infer<typeof commentSchema>

const ERROR_MESSAGES: Record<string, string> = {
  RATE_LIMIT_EXCEEDED:
    "Você comentou muitas vezes em pouco tempo. Tente de novo em instantes.",
  COMMENT_NOT_FOUND:
    "O comentário que você respondeu não está mais disponível.",
  VIDEO_NOT_FOUND: "Este vídeo não está mais disponível.",
}
const FALLBACK_ERROR = "Não foi possível publicar seu comentário."

type NewCommentFormProps = {
  /** Publica e devolve o resultado; o estado otimista é da CommentsSection. */
  onSubmit: (body: string) => Promise<MutationOutcome<Comment>>
  isAuthenticated: boolean
  /** Nome do canal de quem comenta, para as iniciais do avatar. */
  viewerName?: string
  /** Modo resposta (OQ-12): o mesmo formulário, com rótulos de resposta. */
  mode?: "comment" | "reply"
  id?: string
  autoFocus?: boolean
} & Omit<React.ComponentProps<"form">, "onSubmit" | "children">

/**
 * Compositor de comentário (Figma `new-comment-box` 77:129) e, em modo
 * resposta, o `ReplyForm` — o mesmo componente com `parentId` (OQ-12). Para o
 * anônimo, foco ou clique leva ao login com `returnTo`
 * (social-interactions-anonymous-gate/TD-01 e TD-03).
 */
function NewCommentForm({
  onSubmit,
  isAuthenticated,
  viewerName,
  mode = "comment",
  id,
  autoFocus = false,
  className,
  ...props
}: NewCommentFormProps) {
  const router = useRouter()
  const pathname = usePathname()
  const isReply = mode === "reply"
  const {
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CommentValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: { body: "" },
  })

  const blank = (watch("body") ?? "").trim().length === 0

  function goToLogin() {
    router.push(buildLoginHref(pathname))
  }

  async function submit(values: CommentValues) {
    const outcome = await onSubmit(values.body)
    if (outcome.ok) {
      reset({ body: "" })
      return
    }
    if (outcome.status === 401) {
      goToLogin()
      return
    }
    if (outcome.error === "VALIDATION_ERROR") {
      setError("body", { message: "Revise o texto do comentário" })
      return
    }
    setError("root.serverError", {
      message: ERROR_MESSAGES[outcome.error] ?? FALLBACK_ERROR,
    })
  }

  const label = isReply ? "Sua resposta" : "Seu comentário"
  const fieldId = `${id ?? mode}-body`

  return (
    <form
      id={id}
      data-slot={isReply ? "reply-form" : "new-comment-form"}
      noValidate
      onSubmit={handleSubmit(submit)}
      className={cn(
        "flex flex-col gap-2 rounded-[var(--radius-3)] bg-muted p-3",
        className
      )}
      {...props}
    >
      <div className="flex items-start gap-3">
        {viewerName ? (
          <Avatar size={isReply ? "sm" : "default"} aria-label={viewerName}>
            <AvatarFallback>{initialsOf(viewerName)}</AvatarFallback>
          </Avatar>
        ) : null}

        <label htmlFor={fieldId} className="sr-only">
          {label}
        </label>
        <Textarea
          id={fieldId}
          rows={isReply ? 2 : 1}
          autoFocus={autoFocus && isAuthenticated}
          placeholder={
            isReply ? "Adicione uma resposta…" : "Adicione um comentário…"
          }
          aria-invalid={errors.body ? true : undefined}
          aria-describedby={errors.body ? `${fieldId}-error` : undefined}
          onFocus={isAuthenticated ? undefined : goToLogin}
          readOnly={!isAuthenticated}
          className="min-h-0 flex-1"
          {...register("body")}
        />

        <Button
          type={isAuthenticated ? "submit" : "button"}
          onClick={isAuthenticated ? undefined : goToLogin}
          disabled={isAuthenticated && (blank || isSubmitting)}
        >
          {isReply ? "Responder" : "Comentar"}
        </Button>
      </div>

      {errors.body?.message ? (
        <p id={`${fieldId}-error`} className="text-caption text-destructive">
          {errors.body.message}
        </p>
      ) : null}
      {errors.root?.serverError?.message ? (
        <p
          role="alert"
          data-slot="comment-form-error"
          className="text-caption text-destructive"
        >
          {errors.root.serverError.message}
        </p>
      ) : null}
    </form>
  )
}

export { NewCommentForm }
