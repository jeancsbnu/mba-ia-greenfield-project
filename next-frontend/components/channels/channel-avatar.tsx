import * as React from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { initialsOf } from "@/lib/format"

type ChannelAvatarProps = {
  /** Sem nickname (comentário otimista ainda sem autor), só as iniciais. */
  nickname?: string
  name: string
  /** Muda a URL depois de trocar a foto, para não reaproveitar a anterior. */
  version?: string | number
} & Omit<React.ComponentProps<typeof Avatar>, "children">

/** URL da foto do canal no BFF; 302 para a imagem ou 404 sem foto. */
function channelAvatarSrc(nickname: string, version?: string | number): string {
  const base = `/api/channels/${encodeURIComponent(nickname)}/avatar`
  return version === undefined ? base : `${base}?v=${encodeURIComponent(String(version))}`
}

// Foto do canal com as iniciais por baixo: o Radix só troca o fallback pela
// imagem depois que ela carrega, então canal sem foto (404) continua nas
// iniciais sem piscar.
function ChannelAvatar({
  nickname,
  name,
  version,
  ...props
}: ChannelAvatarProps) {
  return (
    <Avatar {...props}>
      {nickname ? (
        <AvatarImage src={channelAvatarSrc(nickname, version)} alt="" />
      ) : null}
      <AvatarFallback>{initialsOf(name)}</AvatarFallback>
    </Avatar>
  )
}

export { ChannelAvatar, channelAvatarSrc }
