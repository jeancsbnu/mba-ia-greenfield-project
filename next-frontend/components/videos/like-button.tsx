import * as React from "react"

import { Button } from "@/components/ui/button"
import { formatCount } from "@/lib/format"

type LikeButtonProps = {
  pressed: boolean
  count: number
} & Omit<React.ComponentProps<typeof Button>, "children" | "aria-pressed">

// "Gostei · N" (Figma `like-button` 77:121): o controle carrega a contagem de
// likes. Estado e mutação vêm do container (`VideoReactions`).
function LikeButton({ pressed, count, ...props }: LikeButtonProps) {
  return (
    <Button
      type="button"
      variant="secondary"
      data-slot="like-button"
      aria-pressed={pressed}
      {...props}
    >
      {`Gostei · ${formatCount(count)}`}
    </Button>
  )
}

export { LikeButton }
