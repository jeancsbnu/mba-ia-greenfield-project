import { z } from "zod"

import type { VideoCategory, VideoVisibility } from "@/lib/api/contracts"

/**
 * Categorias do TD-10, derivadas do contrato em vez de reescritas: se o enum do
 * backend mudar, o `satisfies` abaixo quebra a compilação.
 */
export const VIDEO_CATEGORIES = [
  "Música",
  "Jogos",
  "Educação",
  "Entretenimento",
  "Notícias",
  "Esportes",
  "Tecnologia",
  "Outros",
] as const satisfies readonly VideoCategory[]

export const VIDEO_VISIBILITIES = [
  "public",
  "unlisted",
] as const satisfies readonly VideoVisibility[]

/** Espelha o ParseFilePipeBuilder do backend (SI-04.3). */
export const THUMBNAIL_MAX_BYTES = 2 * 1024 * 1024
export const THUMBNAIL_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const

const TITLE_MAX = 100
const DESCRIPTION_MAX = 5000

// Espelho client-side das regras do backend (phase-02-auth-frontend/TD-04): o
// servidor continua sendo a autoridade, isto só evita um round-trip inútil.
export const videoEditSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Informe um título")
    .max(TITLE_MAX, `O título deve ter no máximo ${String(TITLE_MAX)} caracteres`),
  description: z
    .string()
    .max(
      DESCRIPTION_MAX,
      `A descrição deve ter no máximo ${String(DESCRIPTION_MAX)} caracteres`
    ),
  category: z.enum(VIDEO_CATEGORIES, {
    message: "Selecione uma categoria",
  }),
  visibility: z.enum(VIDEO_VISIBILITIES, {
    message: "Selecione a visibilidade",
  }),
})

export type VideoEditValues = z.infer<typeof videoEditSchema>

type ThumbnailProblem = "type" | "size"

/**
 * Valida a thumbnail separadamente do schema: o arquivo não vem de um campo
 * controlado pelo react-hook-form, e o erro é exibido sob o uploader, não
 * junto dos campos de texto.
 *
 * @returns `null` quando não há arquivo ou ele é válido.
 */
export function validateThumbnail(file: File | null): ThumbnailProblem | null {
  if (!file) return null
  if (!THUMBNAIL_MIME_TYPES.includes(file.type as (typeof THUMBNAIL_MIME_TYPES)[number])) {
    return "type"
  }
  if (file.size > THUMBNAIL_MAX_BYTES) return "size"
  return null
}

export const THUMBNAIL_ERROR_MESSAGES: Record<ThumbnailProblem, string> = {
  type: "A thumbnail deve ser JPEG, PNG ou WebP.",
  size: "A thumbnail deve ter no máximo 2 MB.",
}
