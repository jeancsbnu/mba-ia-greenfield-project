// Constantes compartilhadas entre a rota GET /api/auth/refresh e o helper de
// leitura em Server Component. Vivem aqui, e não no route.ts, para que importar
// a marca não arraste o módulo de rota (e suas dependências) junto.

/** Rota de retorno quando `returnTo` é ausente ou não confiável. */
export const DEFAULT_RETURN_TO = "/channel/videos"

/**
 * Marca "esta navegação já veio de um refresh". Um 401 numa URL que já a carrega
 * significa que renovar não resolveu — daí segue para o login, sem laço.
 */
export const REFRESHED_PARAM = "session_refreshed"
