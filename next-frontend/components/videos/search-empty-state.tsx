import Link from "next/link"

import { SearchIcon } from "@/components/icons/search-icon"
import { cn } from "@/lib/utils"

type SearchEmptyStateProps = {
  q: string
  className?: string
}

// Zero resultados não é erro: a ResultsPage troca título, grade e paginação
// por este bloco (home-busca/TD-05). O termo vem da URL e entra como texto —
// o React escapa, então `<b>` digitado aparece literal.
function SearchEmptyState({ q, className }: SearchEmptyStateProps) {
  return (
    <section
      data-slot="search-empty-state"
      className={cn(
        "flex flex-col items-center gap-3 rounded-[var(--radius-4)] bg-card px-6 py-16 text-center",
        className
      )}
    >
      <span className="flex size-14 items-center justify-center rounded-[var(--radius-full)] bg-muted text-muted-foreground">
        <SearchIcon className="size-7" />
      </span>
      <h1 className="text-h3 text-foreground">
        {`Nenhum vídeo encontrado para “${q}”`}
      </h1>
      <p className="text-body-md text-muted-foreground">
        Confira a ortografia ou tente termos mais gerais, como o nome do canal.
      </p>
      <Link href="/" className="text-label-md text-link hover:underline">
        Voltar para o início
      </Link>
    </section>
  )
}

export { SearchEmptyState }
