"use client"

import * as React from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAvatarVersion } from "@/lib/channels/avatar-version"
import { initialsOf } from "@/lib/format"

type ChannelAvatarProps = {
  /** Sem nickname (comentário otimista ainda sem autor), só as iniciais. */
  nickname?: string
  name: string
  /** Força uma versão da URL; sem ela, vale a do store (troca nesta página). */
  version?: string | number
} & Omit<React.ComponentProps<typeof Avatar>, "children">

/** URL da foto do canal no BFF; 302 para a imagem ou 404 sem foto. */
function channelAvatarSrc(nickname: string, version?: string | number): string {
  const base = `/api/channels/${encodeURIComponent(nickname)}/avatar`
  return version === undefined ? base : `${base}?v=${encodeURIComponent(String(version))}`
}

// Foto do canal com as iniciais por baixo: o Radix só troca o fallback pela
// imagem depois que ela carrega, então canal sem foto (404) continua nas
// iniciais sem piscar. Client component pela versão da foto, que muda quando
// o dono a troca nesta página (navbar, menu e seletor juntos).
function ChannelAvatar({
  nickname,
  name,
  version,
  ...props
}: ChannelAvatarProps) {
  const bumped = useAvatarVersion(nickname)
  const effectiveVersion = version ?? bumped

  return (
    <Avatar {...props}>
      {nickname ? (
        <AvatarImage
          // A key remonta a imagem: o Radix guarda o status (erro/carregada)
          // por instância, e só uma URL nova não o reinicia.
          key={effectiveVersion}
          src={channelAvatarSrc(nickname, effectiveVersion)}
          alt=""
        />
      ) : null}
      <AvatarFallback>{initialsOf(name)}</AvatarFallback>
    </Avatar>
  )
}

export { ChannelAvatar, channelAvatarSrc }
