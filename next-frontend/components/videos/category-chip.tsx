import Link from "next/link"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

const categoryChipVariants = cva(
  [
    "inline-flex shrink-0 items-center justify-center whitespace-nowrap",
    "rounded-[var(--radius-full)] border px-3.5 py-1.5 text-label-md",
    "transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  ].join(" "),
  {
    variants: {
      state: {
        default: "border-border bg-card text-foreground hover:bg-muted",
        selected: "border-primary bg-primary text-primary-foreground",
      },
    },
    defaultVariants: { state: "default" },
  }
)

type CategoryChipProps = {
  label: string
  href: string
  selected?: boolean
  className?: string
}

// Chip de categoria da home (componente Figma `category-chip`, state
// default|selected). É navegação por URL, sem I/O próprio (home-busca/TD-01).
function CategoryChip({
  label,
  href,
  selected = false,
  className,
}: CategoryChipProps) {
  const state = selected ? "selected" : "default"
  return (
    <Link
      href={href}
      data-slot="category-chip"
      data-state={state}
      aria-current={selected ? "page" : undefined}
      className={cn(categoryChipVariants({ state }), className)}
    >
      {label}
    </Link>
  )
}

export { CategoryChip, categoryChipVariants }
