"use client"

import * as React from "react"
import Form from "next/form"

import { SearchIcon } from "@/components/icons/search-icon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SEARCH_MAX_LENGTH, SEARCH_MIN_LENGTH } from "@/lib/search"
import { cn } from "@/lib/utils"

type SearchFormProps = {
  id?: string
  defaultValue?: string
  variant?: "desktop" | "mobile"
  autoFocus?: boolean
  className?: string
}

// Busca por navegação: `next/form` envia para /results?q= sem I/O próprio
// (home-busca/TD-06). Quem busca é a ResultsPage. O navegador barra o termo
// fora dos limites antes de navegar, e a ResultsPage repete a barreira.
//
// No mobile o submit é o próprio botão "Buscar" da barra, fora do form e
// ligado a ele pelo atributo `form`: é o mesmo controle que abre a busca, e
// por isso a variante mobile não renderiza botão.
function SearchForm({
  id,
  defaultValue = "",
  variant = "desktop",
  autoFocus = false,
  className,
}: SearchFormProps) {
  const inputId = React.useId()

  return (
    <Form
      id={id}
      action="/results"
      role="search"
      data-slot="search-form"
      data-variant={variant}
      className={cn("flex w-full items-center gap-2", className)}
    >
      <label htmlFor={inputId} className="sr-only">
        Buscar vídeos ou canais
      </label>
      <div className="relative min-w-0 flex-1">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          // Remonta quando a URL traz outro termo: `defaultValue` só vale na
          // montagem, e a navbar sobrevive à navegação entre buscas.
          key={defaultValue}
          id={inputId}
          type="search"
          name="q"
          required
          minLength={SEARCH_MIN_LENGTH}
          maxLength={SEARCH_MAX_LENGTH}
          defaultValue={defaultValue}
          autoFocus={autoFocus}
          placeholder="Buscar vídeos ou canais"
          className="pl-9"
        />
      </div>
      {variant === "desktop" ? <Button type="submit">Buscar</Button> : null}
    </Form>
  )
}

export { SearchForm }
