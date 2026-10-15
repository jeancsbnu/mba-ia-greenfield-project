import { upstream } from "@/lib/api/upstream";
import {
  CONFIRMATION_PARAM,
  outcomeFromStatus,
  type ConfirmationOutcome,
} from "@/lib/auth/confirmation-notice";

// Ponte de confirmação de e-mail (testes-producao/TD-07). O link que o Nest
// envia aponta para `${APP_URL}/auth/confirm-email?token=` — por isso a rota
// fica fora de `app/api/`, no path do link. Ela repassa a confirmação ao Nest
// pelo `upstream` (que já anexa `X-Client-IP` e `X-Internal-Token`) e manda
// para o login com o desfecho em `?confirmation=`, que a tela de login
// mostra como aviso (confirmada, link inválido ou falha momentânea).
//
// É uma ponte: quando a tela RSC de confirmação (adiada em
// phase-02-auth-frontend/TD-07) for entregue, ela ocupa este mesmo path e esta
// rota sai, sem mudar o link do e-mail.
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");

  let outcome: ConfirmationOutcome = "invalid";
  if (token) {
    const { response } = await upstream.GET("/auth/confirm-email", {
      params: { query: { token } },
    });
    outcome = outcomeFromStatus(response.status);
  }

  // `Location` relativo de propósito: no servidor `standalone` o `request.url`
  // é montado com o HOSTNAME do processo (`0.0.0.0`), não com o host que o
  // navegador pediu, e um redirect absoluto mandaria o visitante para lá.
  return new Response(null, {
    status: 303,
    headers: { Location: `/login?${CONFIRMATION_PARAM}=${outcome}` },
  });
}
