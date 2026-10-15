import * as React from "react"
import Link from "next/link"

import type { ConfirmationOutcome } from "@/lib/auth/confirmation-notice"
import { cn } from "@/lib/utils"

type ConfirmationNoticeProps = {
  outcome: ConfirmationOutcome
} & Omit<React.ComponentProps<"div">, "children">

// Desfecho do link de confirmação, trazido pela ponte /auth/confirm-email.
// Sucesso é `status`; link inválido e falha são `alert`, com caminho de saída.
function ConfirmationNotice({
  outcome,
  className,
  ...props
}: ConfirmationNoticeProps) {
  const base = "flex w-full flex-col gap-1 rounded-[var(--radius-2)] border px-4 py-3 text-body-md"

  if (outcome === "confirmed") {
    return (
      <div
        data-slot="confirmation-notice"
        data-outcome={outcome}
        role="status"
        className={cn(base, "border-border bg-muted text-foreground", className)}
        {...props}
      >
        <span className="text-label-lg">Conta confirmada</span>
        <span className="text-muted-foreground">
          Entre com seu e-mail e senha.
        </span>
      </div>
    )
  }

  return (
    <div
      data-slot="confirmation-notice"
      data-outcome={outcome}
      role="alert"
      className={cn(base, "border-destructive text-destructive", className)}
      {...props}
    >
      {outcome === "invalid" ? (
        <>
          <span className="text-label-lg">Link de confirmação inválido</span>
          <span>
            O link expirou ou já foi substituído por um mais novo.{" "}
            <Link
              href="/resend-confirmation"
              className="text-link hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 rounded-[var(--radius-0-5)]"
            >
              Reenviar e-mail de confirmação
            </Link>
          </span>
        </>
      ) : (
        <>
          <span className="text-label-lg">Não foi possível confirmar agora</span>
          <span>Abra o link do e-mail de novo em alguns instantes.</span>
        </>
      )}
    </div>
  )
}

export { ConfirmationNotice }
