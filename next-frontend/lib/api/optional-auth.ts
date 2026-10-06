import "server-only";

import { getSession } from "@/lib/auth/session";

type OptionalAuthInit = {
  headers?: { Authorization: string };
};

/**
 * Leitura pública com autenticação opcional
 * (social-interactions-anonymous-gate/TD-02).
 *
 * Com sessão, chama o upstream com o Bearer dela — é o que preenche o estado
 * pessoal (meu like, minha inscrição) no mesmo payload da página. Sem sessão,
 * chama anônimo direto. Num `401`, repete a chamada sem o header e devolve o
 * resultado anônimo.
 *
 * Diferente de `fetchFromUpstream`: aquele exige sessão e redireciona para o
 * login, o que é incompatível com página pública. Este nunca redireciona e
 * nunca grava cookie, então serve Server Component e Route Handler. O upstream
 * de hoje segue anônimo em rota `@Public()` com token inválido em vez de
 * responder 401 — o ramo do 401 é defensivo, e o TD exige que ele exista.
 *
 * @param request Chamada ao `upstream` que recebe o header Authorization.
 */
export async function fetchWithOptionalAuth<R extends { response: Response }>(
  request: (init: OptionalAuthInit) => Promise<R>
): Promise<R> {
  const session = await getSession();

  if (!session.isLoggedIn || !session.accessToken) {
    return request({});
  }

  const authenticated = await request({
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });

  if (authenticated.response.status === 401) {
    return request({});
  }

  return authenticated;
}
