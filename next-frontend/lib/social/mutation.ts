import type { ApiErrorEnvelope } from "@/lib/api/contracts"

export type MutationOutcome<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string }

/**
 * Chamada de mutação social a uma rota BFF same-origin (reação, inscrição,
 * comentário). Devolve o corpo no sucesso, ou o status e o código de domínio
 * (`error` do envelope) na falha — a tradução para UX é de quem chama.
 */
export async function sendMutation<T>(
  url: string,
  method: "PUT" | "DELETE" | "POST",
  body?: unknown
): Promise<MutationOutcome<T>> {
  const response = await fetch(url, {
    method,
    ...(body !== undefined && {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  })

  if (response.ok) {
    return { ok: true, data: (await response.json()) as T }
  }

  const envelope = (await response.json().catch(() => null)) as
    | ApiErrorEnvelope
    | null
  return {
    ok: false,
    status: response.status,
    error: envelope?.error ?? "UNKNOWN_ERROR",
  }
}
