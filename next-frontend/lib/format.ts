const countFormatter = new Intl.NumberFormat("pt-BR")

const absoluteDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
})

const relativeFormatter = new Intl.RelativeTimeFormat("pt-BR", {
  numeric: "auto",
})

/** Contagem com separador de milhar pt-BR: 1284 → "1.284". */
export function formatCount(value: number): string {
  return countFormatter.format(value)
}

type FormattedDate = {
  /** Rótulo curto exibido na célula. */
  label: string
  /** Data por extenso, para o `title` do elemento. */
  absolute: string
}

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const WEEK = 7 * DAY
const MONTH = 30 * DAY
const YEAR = 365 * DAY

/**
 * Data de publicação como rótulo relativo ("há 3 dias") com a data absoluta
 * junto, para o `title`.
 *
 * O relativo é o que o design mostra, mas sozinho ele esconde a informação
 * exata; o absoluto no `title` devolve essa precisão sem ocupar a célula.
 *
 * @param now Injetável para o teste não depender do relógio.
 */
export function formatRelativeDate(
  isoDate: string,
  now: Date = new Date()
): FormattedDate {
  const date = new Date(isoDate)

  // Validar antes de formatar: Intl.DateTimeFormat.format lança RangeError com
  // uma data inválida, em vez de devolver "Invalid Date".
  if (Number.isNaN(date.getTime())) {
    return { label: isoDate, absolute: isoDate }
  }

  const absolute = absoluteDateFormatter.format(date)
  const elapsed = now.getTime() - date.getTime()

  // Datas no futuro não deveriam ocorrer numa publicação; cair no absoluto é
  // mais honesto do que exibir "daqui a 2 dias".
  if (elapsed < 0) {
    return { label: absolute, absolute }
  }

  const [unit, ms]: [Intl.RelativeTimeFormatUnit, number] =
    elapsed < HOUR
      ? ["minute", MINUTE]
      : elapsed < DAY
        ? ["hour", HOUR]
        : elapsed < WEEK
          ? ["day", DAY]
          : elapsed < MONTH
            ? ["week", WEEK]
            : elapsed < YEAR
              ? ["month", MONTH]
              : ["year", YEAR]

  const amount = Math.floor(elapsed / ms)
  return { label: relativeFormatter.format(-amount, unit), absolute }
}

/**
 * Contagem de vídeos do canal, com singular correto.
 *
 * O mock do Figma só mostra o plural; sem isto um canal com um vídeo exibiria
 * "1 vídeos".
 */
export function formatVideosCount(count: number): string {
  return count === 1 ? "1 vídeo" : `${formatCount(count)} vídeos`
}

/**
 * Iniciais para o fallback do Avatar: primeira letra de até duas palavras, em
 * maiúsculas; "?" para um nome vazio.
 *
 * Não há upload de avatar (OQ-21), então o fallback é o caminho principal de
 * todo avatar do projeto — canal, comentário e menu do usuário.
 */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return "?"
  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toLocaleUpperCase("pt-BR")
}
