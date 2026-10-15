import { AuthFooter } from "@/components/auth/auth-footer"
import { BrandLogo } from "@/components/auth/brand-logo"
import { ConfirmationNotice } from "@/components/auth/confirmation-notice"
import { LoginForm } from "@/components/auth/login-form"
import { Card } from "@/components/ui/card"
import {
  CONFIRMATION_PARAM,
  parseConfirmationOutcome,
} from "@/lib/auth/confirmation-notice"
import { RETURN_TO_PARAM } from "@/lib/auth/return-to"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  // O returnTo chega como prop em vez de useSearchParams no formulário: este
  // não precisa de um <Suspense> só para ler a query string.
  const params = await searchParams
  const raw = params[RETURN_TO_PARAM]
  const returnTo = Array.isArray(raw) ? raw[0] : raw
  // Aviso da ponte de confirmação de e-mail (/auth/confirm-email).
  const confirmation = parseConfirmationOutcome(params[CONFIRMATION_PARAM])

  return (
    <main className="flex flex-1 items-center justify-center bg-background px-4 py-10 lg:px-12">
      <Card className="w-full max-w-[448px] items-center gap-6 px-6 py-10">
        <BrandLogo size="lg" />

        <h1 className="text-h1 text-foreground text-center">Entrar</h1>

        {confirmation ? <ConfirmationNotice outcome={confirmation} /> : null}

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
