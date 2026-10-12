import { SiteNavbar } from "@/components/layout/site-navbar"
import { getViewerChannel } from "@/lib/api/viewer-channel"

/**
 * Navbar de todas as telas com chrome, montada uma vez em layout
 * (home-busca/TD-07, Revision de 2026-10-11). Resolve no servidor quem está
 * vendo — nome e nickname do canal, por `getViewerChannel` (GET /me/channel com
 * auth opcional, memoizado por requisição) — e entrega à SiteNavbar. Uma falha
 * nessa leitura degrada para o chrome anônimo e nunca derruba a página.
 */
async function PublicSiteNavbar() {
  const channel = await getViewerChannel()
  const viewer = channel
    ? { name: channel.name, nickname: channel.nickname }
    : null

  return <SiteNavbar viewer={viewer} />
}

export { PublicSiteNavbar }
