import { PublicSiteNavbar } from "@/components/layout/public-site-navbar"

// Chrome das telas públicas, montado uma vez em layout (home-busca/TD-07,
// Revision de 2026-10-11). O gutter segue as regras responsivas de
// home-busca/TD-08: px-4 no mobile, px-12 a partir de lg.
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicSiteNavbar />
      <main className="flex flex-1 flex-col px-4 lg:px-12">{children}</main>
    </div>
  )
}
