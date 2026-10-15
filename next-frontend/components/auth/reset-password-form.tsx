"use client"

import * as React from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { FieldError } from "@/components/auth/field-error"
import { PasswordStrengthMeter } from "@/components/auth/password-strength-meter"
import { PasswordVisibilityToggle } from "@/components/auth/password-visibility-toggle"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ApiErrorEnvelope } from "@/lib/api/contracts"
import { mapResetPasswordErrorToForm } from "@/lib/auth/error-mapping"
import { cn } from "@/lib/utils"

// Mesma regra de senha do cadastro (signup-form), mais o teto de 128 do
// ResetPasswordDto: a senha nova não pode ser mais fraca que a de criação.
const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .max(128, "Máximo 128 caracteres")
      .regex(/[a-zA-Z]/, "Inclua ao menos uma letra")
      .regex(/[0-9]/, "Inclua ao menos um número"),
    confirmPassword: z.string().min(1, "Confirme sua senha"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  })

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>

type ResetPasswordFormProps = {
  /** Token do link do e-mail; ausente quando a URL chega sem `?token=`. */
  token: string | null
} & React.ComponentProps<"form">

function InvalidLink({ className }: { className?: string }) {
  return (
    <div
      data-slot="reset-password-invalid"
      role="alert"
      className={cn(
        "flex w-full flex-col items-center gap-4 text-center",
        className
      )}
    >
      <p className="text-label-lg text-foreground">Link inválido ou expirado</p>
      <p className="text-body-md text-muted-foreground">
        Este link de redefinição não vale mais. Peça um novo e use o link do
        e-mail mais recente.
      </p>
      <Button asChild size="md" className="w-full">
        <Link href="/forgot-password">Pedir um novo link</Link>
      </Button>
    </div>
  )
}

function ResetPasswordForm({
  token,
  className,
  ...props
}: ResetPasswordFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  })

  const [status, setStatus] = React.useState<"form" | "success" | "invalid">(
    token ? "form" : "invalid"
  )
  const [passwordType, setPasswordType] = React.useState<"password" | "text">(
    "password"
  )
  const [confirmType, setConfirmType] = React.useState<"password" | "text">(
    "password"
  )
  const passwordValue = watch("newPassword")

  async function onSubmit(values: ResetPasswordValues) {
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, new_password: values.newPassword }),
    })

    if (res.status === 401) {
      // INVALID_TOKEN ou TOKEN_EXPIRED: o formulário não tem como resolver,
      // só um link novo resolve.
      setStatus("invalid")
      return
    }

    if (!res.ok) {
      const envelope = (await res.json()) as ApiErrorEnvelope
      mapResetPasswordErrorToForm(envelope, setError)
      return
    }

    setStatus("success")
  }

  if (status === "invalid") {
    return <InvalidLink className={className} />
  }

  if (status === "success") {
    return (
      <div
        data-slot="reset-password-success"
        role="status"
        className={cn(
          "flex w-full flex-col items-center gap-4 text-center",
          className
        )}
      >
        <p className="text-label-lg text-foreground">Senha redefinida</p>
        <p className="text-body-md text-muted-foreground">
          Entre com a sua nova senha.
        </p>
        <Button asChild size="md" className="w-full">
          <Link href="/login">Ir para o login</Link>
        </Button>
      </div>
    )
  }

  return (
    <form
      data-slot="reset-password-form"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className={cn("flex w-full flex-col gap-4", className)}
      {...props}
    >
      {errors.root?.serverError?.message && (
        <p
          role="alert"
          className="text-caption text-destructive"
          data-slot="form-error"
        >
          {errors.root.serverError.message}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="newPassword">Nova senha</Label>
        <div className="relative">
          <Input
            id="newPassword"
            type={passwordType}
            autoComplete="new-password"
            placeholder="Crie uma nova senha"
            className="pr-12"
            aria-invalid={!!errors.newPassword}
            {...register("newPassword")}
          />
          <PasswordVisibilityToggle
            onTypeChange={setPasswordType}
            className="absolute inset-y-0 right-2 my-auto"
          />
        </div>
        <PasswordStrengthMeter value={passwordValue} />
        <FieldError message={errors.newPassword?.message} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={confirmType}
            autoComplete="new-password"
            placeholder="Repita a nova senha"
            className="pr-12"
            aria-invalid={!!errors.confirmPassword}
            {...register("confirmPassword")}
          />
          <PasswordVisibilityToggle
            onTypeChange={setConfirmType}
            className="absolute inset-y-0 right-2 my-auto"
          />
        </div>
        <FieldError message={errors.confirmPassword?.message} />
      </div>

      <Button type="submit" size="md" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Salvando…" : "Redefinir senha"}
      </Button>
    </form>
  )
}

export { ResetPasswordForm }
