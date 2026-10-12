import { redirect } from "next/navigation"

import { PublicSiteNavbar } from "@/components/layout/public-site-navbar"
import { getSession } from "@/lib/auth/session"

// Route group autenticado das telas do canal. A navbar é a mesma do site
// (home-busca/TD-07, Revision de 2026-10-11): o PublicSiteNavbar lê o canal de
// GET /me/channel a cada requisição, e não de session.channelSlug, que o login
// grava vazio e a troca de nickname envelheceria (TD-09).
export default async function StudioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session.isLoggedIn) {
    redirect("/login")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <PublicSiteNavbar />

      <main className="flex-1">{children}</main>
    </div>
  )
}
