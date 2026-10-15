import * as React from "react"

// Versão da foto por nickname, só no navegador. A URL da foto de um canal é
// sempre a mesma (/api/channels/{nickname}/avatar); depois de uma troca, cada
// avatar daquele canal na página precisa de uma URL nova para buscar a imagem
// de novo — o da navbar já tinha guardado o 404 da URL antiga.
const versions = new Map<string, number>()
const listeners = new Set<() => void>()

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Marca que a foto do canal mudou: os avatares dele buscam a imagem de novo. */
export function bumpAvatarVersion(nickname: string): void {
  versions.set(nickname, (versions.get(nickname) ?? 0) + 1)
  listeners.forEach((listener) => listener())
}

export function getAvatarVersion(nickname: string): number | undefined {
  return versions.get(nickname)
}

/** Versão atual da foto do canal; `undefined` até a primeira troca. */
export function useAvatarVersion(nickname?: string): number | undefined {
  return React.useSyncExternalStore(
    subscribe,
    () => (nickname ? versions.get(nickname) : undefined),
    () => undefined
  )
}
