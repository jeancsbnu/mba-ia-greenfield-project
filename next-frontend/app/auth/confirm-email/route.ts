import { upstream } from "@/lib/api/upstream";

// Ponte de confirmação de e-mail (testes-producao/TD-07). O link que o Nest
// envia aponta para `${APP_URL}/auth/confirm-email?token=` — por isso a rota
// fica fora de `app/api/`, no path do link. Ela repassa a confirmação ao Nest
// pelo `upstream` (que já anexa `X-Client-IP` e `X-Internal-Token`) e manda
// para o login em qualquer desfecho: não há tela para mostrar erro, e o login
// já recusa conta não confirmada com 403 EMAIL_NOT_CONFIRMED.
//
// É uma ponte: quando a tela RSC de confirmação (adiada em
// phase-02-auth-frontend/TD-07) for entregue, ela ocupa este mesmo path e esta
// rota sai, sem mudar o link do e-mail.
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");

  if (token) {
    await upstream.GET("/auth/confirm-email", {
      params: { query: { token } },
    });
  }

  // `Location` relativo de propósito: no servidor `standalone` o `request.url`
  // é montado com o HOSTNAME do processo (`0.0.0.0`), não com o host que o
  // navegador pediu, e um redirect absoluto mandaria o visitante para lá.
  return new Response(null, { status: 303, headers: { Location: "/login" } });
}
