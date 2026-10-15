import type { FieldValues, Path, UseFormSetError } from "react-hook-form"

import type { ApiErrorEnvelope } from "@/lib/api/contracts"

// A `message` do envelope é texto técnico em inglês da API ("Invalid email or
// password"): os formulários mostram o texto em português do status, que é o
// mesmo critério que cada mapeamento abaixo usa para decidir onde exibir.
const MESSAGES_BY_STATUS: Record<number, string> = {
  400: "Verifique os dados informados.",
  401: "E-mail ou senha incorretos.",
  403: "Confirme seu e-mail antes de entrar.",
  409: "Este e-mail já está cadastrado. Você pode",
  429: "Muitas tentativas. Aguarde um pouco e tente de novo.",
}

const FALLBACK_MESSAGE = "Não foi possível concluir agora. Tente de novo."

/** Texto para o usuário a partir do envelope de erro do upstream. */
export function userMessage(envelope: ApiErrorEnvelope): string {
  return MESSAGES_BY_STATUS[envelope.statusCode] ?? FALLBACK_MESSAGE
}

/**
 * Maps the upstream `ApiErrorEnvelope` (passed through by the BFF Route Handler)
 * onto react-hook-form field/root errors.
 *
 * The signup contract does not enumerate machine-readable per-field codes
 * (`RegisterDto` has no declared properties yet), so the mapping keys on the
 * HTTP `statusCode` per the screen's Error Catalog → UX mapping:
 *  - 409: e-mail already registered → inline hint on the `email` field
 *          (the field's hint renders a "fazer login" CTA at the call site).
 *  - 400: validation failed → form-level inline message (`root.serverError`),
 *          deliberately NOT bound to the `email` field so it is visually
 *          distinct from the 409 email hint.
 *  - anything else → `root.serverError`.
 */
export function mapSignupErrorToForm<T extends FieldValues>(
  envelope: ApiErrorEnvelope,
  setError: UseFormSetError<T>,
): void {
  const message = userMessage(envelope)

  if (envelope.statusCode === 409) {
    setError("email" as Path<T>, { type: "server", message })
    return
  }

  setError("root.serverError" as Path<T>, { type: "server", message })
}

/**
 * Maps the upstream `ApiErrorEnvelope` onto react-hook-form errors for the
 * login screen, per its Error Catalog → UX mapping:
 *  - 403: e-mail not confirmed → distinct form-level root error
 *          (`root.confirmation`) so the form renders a resend-confirmation CTA.
 *  - 400: validation failed → inline message on the `email` field (the
 *          offending field; the login contract has no machine-readable
 *          per-field codes — `LoginDto` has no declared properties yet).
 *  - 401 / anything else → form-level alert (`root.serverError`).
 */
export function mapLoginErrorToForm<T extends FieldValues>(
  envelope: ApiErrorEnvelope,
  setError: UseFormSetError<T>,
): void {
  const message = userMessage(envelope)

  if (envelope.statusCode === 403) {
    setError("root.confirmation" as Path<T>, { type: "server", message })
    return
  }

  if (envelope.statusCode === 400) {
    setError("email" as Path<T>, { type: "server", message })
    return
  }

  setError("root.serverError" as Path<T>, { type: "server", message })
}

/**
 * Maps the upstream `ApiErrorEnvelope` onto react-hook-form errors for the
 * forgot-password screen. The only enumerated error is:
 *  - 400: validation failed → inline message on the `email` field
 *          (the only field on this form).
 * Anything else falls back to a form-level error (`root.serverError`).
 */
export function mapForgotPasswordErrorToForm<T extends FieldValues>(
  envelope: ApiErrorEnvelope,
  setError: UseFormSetError<T>,
): void {
  const message = userMessage(envelope)

  if (envelope.statusCode === 400) {
    setError("email" as Path<T>, { type: "server", message })
    return
  }

  setError("root.serverError" as Path<T>, { type: "server", message })
}

/**
 * Maps the upstream `ApiErrorEnvelope` onto react-hook-form errors for the
 * reset-password screen:
 *  - 400: validation failed → inline message on the `newPassword` field.
 *  - anything else → `root.serverError`.
 * The 401 (invalid or expired token) never reaches here: the form swaps to its
 * own "link inválido" state instead of showing a field error.
 */
export function mapResetPasswordErrorToForm<T extends FieldValues>(
  envelope: ApiErrorEnvelope,
  setError: UseFormSetError<T>,
): void {
  const message = userMessage(envelope)

  if (envelope.statusCode === 400) {
    setError("newPassword" as Path<T>, { type: "server", message })
    return
  }

  setError("root.serverError" as Path<T>, { type: "server", message })
}

/**
 * Maps the upstream `ApiErrorEnvelope` onto react-hook-form errors for the
 * resend-confirmation screen. Same shape as forgot-password: the upstream is
 * anti-enumeration (204 for any address), so the only enumerated error is
 *  - 400: validation failed → inline message on the `email` field.
 * Anything else falls back to a form-level error (`root.serverError`).
 */
export function mapResendConfirmationErrorToForm<T extends FieldValues>(
  envelope: ApiErrorEnvelope,
  setError: UseFormSetError<T>,
): void {
  const message = userMessage(envelope)

  if (envelope.statusCode === 400) {
    setError("email" as Path<T>, { type: "server", message })
    return
  }

  setError("root.serverError" as Path<T>, { type: "server", message })
}
