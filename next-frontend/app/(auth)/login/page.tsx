import { AuthFooter } from "@/components/auth/auth-footer"
import { BrandLogo } from "@/components/auth/brand-logo"
import { LoginForm } from "@/components/auth/login-form"
import { Card } from "@/components/ui/card"
import { RETURN_TO_PARAM } from "@/lib/auth/return-to"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  // O returnTo chega como prop em vez de useSearchParams no formulário: este
  // não precisa de um <Suspense> só para ler a query string.
  const raw = (await searchParams)[RETURN_TO_PARAM]
  const returnTo = Array.isArray(raw) ? raw[0] : raw

  return (
    <main className="flex flex-1 items-center justify-center bg-background px-6 py-10">
      <Card className="w-full max-w-[448px] items-center gap-6 px-6 py-10">
        <BrandLogo size="lg" />

        <h1 className="text-h1 text-foreground text-center">Entrar</h1>

        <LoginForm className="w-full" returnTo={returnTo} />

        <AuthFooter
          question="Ainda não tem uma conta?"
          linkLabel="Cadastre-se"
          linkHref="/signup"
        />
      </Card>
    </main>
  )
}
