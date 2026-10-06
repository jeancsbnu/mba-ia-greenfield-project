import * as React from "react"

import { Button } from "@/components/ui/button"

type DislikeButtonProps = {
  pressed: boolean
} & Omit<React.ComponentProps<typeof Button>, "children" | "aria-pressed">

// "Não gostei" (Figma `dislike-button` 77:123) — SEM número em nenhum estado:
// a API não expõe contagem de dislikes (social-interactions/TD-03). Não
// "consertar" acrescentando contagem; o estado é comunicado por aria-pressed.
function DislikeButton({ pressed, ...props }: DislikeButtonProps) {
  return (
    <Button
      type="button"
      variant="secondary"
      data-slot="dislike-button"
      aria-pressed={pressed}
      {...props}
    >
      Não gostei
    </Button>
  )
}

export { DislikeButton }
