import { redirect } from "next/navigation"

import { ChannelUserMenu } from "@/components/layout/channel-user-menu"
import { SiteNavbar } from "@/components/layout/site-navbar"
import type { Channel } from "@/lib/api/contracts"
import { fetchFromUpstream } from "@/lib/api/server-upstream"
import { upstream } from "@/lib/api/upstream"
import { getSession } from "@/lib/auth/session"
import { DEFAULT_RETURN_TO } from "@/lib/auth/refresh-redirect"

// Route group autenticado das três telas do canal. O nome do canal vem de
// GET /me/channel a cada requisição, e não de session.channelSlug: o login
// grava esse campo vazio, e a troca de nickname é livre (TD-07), então o valor
// da sessão envelheceria em silêncio (TD-09).
export default async function StudioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session.isLoggedIn) {
    redirect("/login")
  }

  const channel = await fetchFromUpstream<Channel>(
    (init) => upstream.GET("/me/channel", init),
    DEFAULT_RETURN_TO
  )

  return (
    <div className="flex min-h-screen flex-col">
      <SiteNavbar>
        <ChannelUserMenu channelName={channel.name} />
      </SiteNavbar>

      <main className="flex-1">{children}</main>
    </div>
  )
}
