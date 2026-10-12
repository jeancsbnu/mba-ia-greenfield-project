import { CategoryChip } from "@/components/videos/category-chip"
import type { VideoCategory } from "@/lib/api/contracts"
import { cn } from "@/lib/utils"
import { VIDEO_CATEGORIES } from "@/lib/videos/edit-schema"

type CategoryFilterProps = {
  current: VideoCategory | null
  className?: string
}

// O valor do enum vai cru na URL, só percent-encoded — sem mapa de slugs
// (home-busca/TD-01). "Todos" é a home sem `category`.
function categoryHref(category: VideoCategory): string {
  return `/?category=${encodeURIComponent(category)}`
}

// Faixa de chips da home: "Todos" + as 8 categorias, na ordem do enum. Abaixo
// de `sm` rola na horizontal e continua navegável por Tab (home-busca/TD-08).
function CategoryFilter({ current, className }: CategoryFilterProps) {
  return (
    <nav
      aria-label="Categorias"
      data-slot="category-filter"
      className={cn(
        "-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0",
        className
      )}
    >
      <CategoryChip label="Todos" href="/" selected={current === null} />
      {VIDEO_CATEGORIES.map((category) => (
        <CategoryChip
          key={category}
          label={category}
          href={categoryHref(category)}
          selected={current === category}
        />
      ))}
    </nav>
  )
}

export { CategoryFilter }
