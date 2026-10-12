"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"

import { BrandLogo } from "@/components/auth/brand-logo"
import { ArrowBackIcon } from "@/components/icons/arrow-back-icon"
import { SearchIcon } from "@/components/icons/search-icon"
import { NavigationSheet } from "@/components/layout/navigation-sheet"
import { SearchForm } from "@/components/layout/search-form"
import { UserMenu } from "@/components/layout/user-menu"
import { Button } from "@/components/ui/button"
import { IconButton } from "@/components/ui/icon-button"
import { useLogout } from "@/lib/auth/use-logout"
import { cn } from "@/lib/utils"

type SiteNavbarViewer = {
  name: string
  nickname: string
}

type SiteNavbarProps = {
  viewer: SiteNavbarViewer | null
} & Omit<React.ComponentProps<"header">, "children">

type NavLink = { href: string; label: string; private: boolean }

// Destinos do chrome (home-busca/TD-07, Revision de 2026-10-11): as rotas do
// studio só aparecem com sessão. Em /results nenhum link casa, então nenhum
// fica ativo.
const NAV_LINKS: NavLink[] = [
  { href: "/", label: "Início", private: false },
  { href: "/channel/subscriptions", label: "Canais seguidos", private: true },
  { href: "/channel/videos", label: "Meus vídeos", private: true },
]

const RESULTS_ROUTE = "/results"

// O campo chega preenchido com o `q` da URL em /results (home-busca/TD-06).
// useSearchParams pede um <Suspense> acima; o fallback é o campo vazio.
function NavbarSearch(props: Omit<React.ComponentProps<typeof SearchForm>, "defaultValue">) {
  const q = useSearchParams().get("q") ?? ""
  return <SearchForm {...props} defaultValue={q} />
}

// Navbar única, montada em layout (home-busca/TD-07, Revision de 2026-10-11).
// A troca entre desktop e mobile é só CSS (home-busca/TD-08): a partir de `lg`,
// a barra completa; abaixo, a barra fechada (marca + busca + menu), que expande
// a busca sobre si mesma. A identidade chega do PublicSiteNavbar, e o logout
// vem do hook compartilhado.
function SiteNavbar({ viewer, className, ...props }: SiteNavbarProps) {
  const pathname = usePathname()
  const { signOut, isSigningOut } = useLogout()
  const links = NAV_LINKS.filter((link) => viewer || !link.private)
  const searchFormId = React.useId()
  const searchToggleRef = React.useRef<HTMLButtonElement>(null)

  // Em /results a busca mobile começa expandida, com o termo no campo
  // (premissa do build: o desenho só mostra esse estado). Ao trocar de rota o
  // estado volta ao padrão da rota nova — ajuste durante o render, sem efeito.
  const [searchOpen, setSearchOpen] = React.useState(
    pathname === RESULTS_ROUTE
  )
  // Só a abertura pelo botão leva o foco ao campo; a busca que já nasce
  // aberta em /results não rouba o foco da página.
  const [focusSearch, setFocusSearch] = React.useState(false)
  const [openedOnPath, setOpenedOnPath] = React.useState(pathname)
  if (openedOnPath !== pathname) {
    setOpenedOnPath(pathname)
    setSearchOpen(pathname === RESULTS_ROUTE)
    setFocusSearch(false)
  }

  function openSearch() {
    setSearchOpen(true)
    setFocusSearch(true)
  }

  function closeSearch() {
    setSearchOpen(false)
    // O botão de voltar some ao fechar; o foco vai para o botão que reabre.
    requestAnimationFrame(() => searchToggleRef.current?.focus())
  }

  return (
    <header
      data-slot="site-navbar"
      className={cn(
        "flex w-full items-center justify-between gap-2 border-b border-border px-4 py-3 lg:gap-6 lg:px-12 lg:py-5",
        className
      )}
      {...props}
    >
      {searchOpen ? (
        <IconButton
          aria-label="Fechar busca"
          size="lg"
          className="lg:hidden"
          onClick={closeSearch}
        >
          <ArrowBackIcon />
        </IconButton>
      ) : null}

      <Link
        href="/"
        aria-label="StreamTube"
        className={cn("shrink-0", searchOpen && "hidden lg:block")}
      >
        <BrandLogo size="md" />
      </Link>

      {/* Busca expandida do mobile, sobre a barra. */}
      {searchOpen ? (
        <React.Suspense fallback={<SearchForm id={searchFormId} variant="mobile" />}>
          <NavbarSearch
            id={searchFormId}
            variant="mobile"
            autoFocus={focusSearch}
            className="flex-1 lg:hidden"
          />
        </React.Suspense>
      ) : null}

      {/* Ações da barra fechada (`navbar-actions`): só abaixo de `lg`, sem
          "Entrar" nem avatar — a sessão fica no sheet. */}
      <div
        data-slot="navbar-actions"
        className="flex shrink-0 items-center gap-1 lg:hidden"
      >
        <IconButton
          ref={searchToggleRef}
          aria-label="Buscar"
          size="lg"
          aria-expanded={searchOpen}
          aria-controls={searchFormId}
          // Aberta, a busca é enviada por este mesmo botão.
          type={searchOpen ? "submit" : "button"}
          form={searchOpen ? searchFormId : undefined}
          onClick={searchOpen ? undefined : openSearch}
        >
          <SearchIcon />
        </IconButton>
        {searchOpen ? null : (
          <NavigationSheet
            viewer={viewer}
            pathname={pathname}
            onSignOut={() => void signOut()}
            isSigningOut={isSigningOut}
          />
        )}
      </div>

      <div className="hidden min-w-0 flex-1 items-center gap-6 lg:flex">
        <nav
          aria-label="Navegação principal"
          className="flex shrink-0 items-center gap-6"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              className="text-label-md whitespace-nowrap text-foreground hover:underline aria-[current=page]:text-link"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <React.Suspense fallback={<SearchForm />}>
          <NavbarSearch />
        </React.Suspense>

        {viewer ? (
          <UserMenu
            channelName={viewer.name}
            nickname={viewer.nickname}
            onSignOut={() => void signOut()}
            isSigningOut={isSigningOut}
            className="shrink-0"
          />
        ) : (
          <Button asChild variant="secondary" className="shrink-0">
            <Link href="/login">Entrar</Link>
          </Button>
        )}
      </div>
    </header>
  )
}

export { SiteNavbar }
export type { SiteNavbarViewer }
