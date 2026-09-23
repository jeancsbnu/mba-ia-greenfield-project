import { z } from "zod"

/**
 * Allowlist do nickname, espelhando `^[a-z0-9_]+$` do backend (SI-04.5).
 *
 * O ponto é o caso que mais aparece: o mock do Figma usa "joana.cria", que o
 * backend rejeita. Barrar aqui evita um round-trip só para receber 400.
 */
export const NICKNAME_PATTERN = /^[a-z0-9_]+$/

const NICKNAME_MAX = 50
const NAME_MAX = 50
const DESCRIPTION_MAX = 5000

export const channelEditSchema = z.object({
  nickname: z
    .string()
    .trim()
    .min(1, "Informe um nickname")
    .max(
      NICKNAME_MAX,
      `O nickname deve ter no máximo ${String(NICKNAME_MAX)} caracteres`
    )
    .regex(
      NICKNAME_PATTERN,
      "Use apenas letras minúsculas, números e underscore"
    ),
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome do canal")
    .max(NAME_MAX, `O nome deve ter no máximo ${String(NAME_MAX)} caracteres`),
  description: z
    .string()
    .max(
      DESCRIPTION_MAX,
      `A descrição deve ter no máximo ${String(DESCRIPTION_MAX)} caracteres`
    ),
})

export type ChannelEditValues = z.infer<typeof channelEditSchema>
