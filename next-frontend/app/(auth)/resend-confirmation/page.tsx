import { AuthFooter } from "@/components/auth/auth-footer"
import { BrandLogo } from "@/components/auth/brand-logo"
import { ResendConfirmationForm } from "@/components/auth/resend-confirmation-form"
import { Card } from "@/components/ui/card"

// Destino do "Reenviar e-mail de confirmação" do login (403 EMAIL_NOT_CONFIRMED).
// O e-mail não vem na URL: dado pessoal não viaja em query string.
export default function ResendConfirmationPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-background px-4 py-10 lg:px-12">
      <Card className="w-full max-w-[448px] items-center gap-6 px-6 py-10">
        <BrandLogo size="lg" />

        <h1 className="text-h1 text-foreground text-center">
          Reenviar confirmação
        </h1>
        <p className="text-body-md text-muted-foreground text-center">
          Digite o e-mail da sua conta e enviaremos um novo link de confirmação
        </p>

        <ResendConfirmationForm className="w-full" />

        <AuthFooter
          question="Já confirmou sua conta?"
          linkLabel="Entrar"
          linkHref="/login"
        />
      </Card>
    </main>
  )
}
