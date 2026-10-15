"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { FieldError } from "@/components/auth/field-error"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ApiErrorEnvelope } from "@/lib/api/contracts"
import { mapResendConfirmationErrorToForm } from "@/lib/auth/error-mapping"
import { cn } from "@/lib/utils"

const resendConfirmationSchema = z.object({
  email: z.email("Endereço de e-mail inválido"),
})

type ResendConfirmationValues = z.infer<typeof resendConfirmationSchema>

function ResendConfirmationForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResendConfirmationValues>({
    resolver: zodResolver(resendConfirmationSchema),
    defaultValues: { email: "" },
  })

  const [sent, setSent] = React.useState(false)

  async function onSubmit(values: ResendConfirmationValues) {
    const res = await fetch("/api/auth/resend-confirmation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: values.email }),
    })

    if (!res.ok) {
      const envelope = (await res.json()) as ApiErrorEnvelope
      mapResendConfirmationErrorToForm(envelope, setError)
      return
    }

    // 204 — mesma resposta para conta inexistente ou já confirmada.
    setSent(true)
  }

  if (sent) {
    return (
      <div
        data-slot="resend-confirmation-success"
        role="status"
        className={cn(
          "flex w-full flex-col items-center gap-2 text-center",
          className
        )}
      >
        <p className="text-label-lg text-foreground">Verifique seu e-mail</p>
        <p className="text-body-md text-muted-foreground">
          Se houver uma conta aguardando confirmação nesse endereço, enviamos um
          novo link. Os links anteriores deixam de valer.
        </p>
      </div>
    )
  }

  return (
    <form
      data-slot="resend-confirmation-form"
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
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="Digite seu e-mail"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        <FieldError message={errors.email?.message} />
      </div>

      <Button type="submit" size="md" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Enviando…" : "Reenviar link de confirmação"}
      </Button>
    </form>
  )
}

export { ResendConfirmationForm }
