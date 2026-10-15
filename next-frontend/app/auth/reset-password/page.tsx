import { AuthFooter } from "@/components/auth/auth-footer"
import { BrandLogo } from "@/components/auth/brand-logo"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"
import { Card } from "@/components/ui/card"

// Destino do link do e-mail de recuperação: o Nest monta
// `${APP_URL}/auth/reset-password?token=…` (mail.service.ts), por isso a rota
// fica em app/auth/, ao lado da ponte do confirm-email, e não no grupo (auth).
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const raw = (await searchParams).token
  const token = (Array.isArray(raw) ? raw[0] : raw) || null

  return (
    <main className="flex flex-1 items-center justify-center bg-background px-4 py-10 lg:px-12">
      <Card className="w-full max-w-[448px] items-center gap-6 px-6 py-10">
        <BrandLogo size="lg" />

        <h1 className="text-h1 text-foreground text-center">Criar nova senha</h1>
        <p className="text-body-md text-muted-foreground text-center">
          Escolha uma senha nova para a sua conta
        </p>

        <ResetPasswordForm className="w-full" token={token} />

        <AuthFooter
          question="Lembrou sua senha?"
          linkLabel="Entrar"
          linkHref="/login"
        />
      </Card>
    </main>
  )
}
