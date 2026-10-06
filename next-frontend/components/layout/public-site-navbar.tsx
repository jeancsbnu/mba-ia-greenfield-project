import Link from "next/link"

import { ChannelUserMenu } from "@/components/layout/channel-user-menu"
import { SiteNavbar } from "@/components/layout/site-navbar"
import { Button } from "@/components/ui/button"
import { getViewerChannel } from "@/lib/api/viewer-channel"

/**
 * Navbar das páginas públicas (watch page e página do canal), sensível à
 * sessão: com sessão, avatar + "Sair" e o link "Canais seguidos"; sem sessão,
 * o "Entrar" de sempre. O nome do canal vem de `getViewerChannel` (GET
 * /me/channel com auth opcional, memoizado por requisição) — uma falha nessa
 * leitura degrada para o chrome anônimo e nunca derruba a página.
 */
type PublicSiteNavbarProps = {
  /** Variante do "Entrar" do chrome anônimo — cada tela mantém a do seu desenho. */
  loginVariant?: "secondary" | "outline"
}

async function PublicSiteNavbar({
  loginVariant = "secondary",
}: PublicSiteNavbarProps) {
  const viewer = await getViewerChannel()

  if (viewer) {
    return (
      <SiteNavbar showSubscriptionsLink>
        <ChannelUserMenu channelName={viewer.name} />
      </SiteNavbar>
    )
  }

  return (
    <SiteNavbar>
      <Button asChild variant={loginVariant}>
        <Link href="/login">Entrar</Link>
      </Button>
    </SiteNavbar>
  )
}

export { PublicSiteNavbar }
