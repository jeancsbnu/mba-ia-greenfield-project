import "server-only";
import { redirect } from "next/navigation";

import { REFRESHED_PARAM } from "@/lib/auth/refresh-redirect";
import { getSession } from "@/lib/auth/session";

type UpstreamResult<T> = {
  data?: T;
  response: Response;
};

type AuthorizedInit = {
  headers: { Authorization: string };
};

/**
 * Leitura autenticada a partir de um Server Component.
 *
 * Um Server Component não pode gravar cookie, então ele não consegue renovar a
 * sessão sozinho como o `withRefresh` faz nos Route Handlers. A saída é
 * delegar: num `401` redirecionamos para `GET /api/auth/refresh`, que renova o
 * cookie e devolve o usuário para `returnTo` — agora marcado com
 * `REFRESHED_PARAM`. Se outro `401` chega numa URL já marcada, a renovação não
 * resolveu e mandamos para o login, o que fecha o laço.
 *
 * @param request  Chamada ao `upstream` que recebe o header Authorization.
 * @param returnTo Caminho atual (path + query) para onde voltar após renovar.
 */
export async function fetchFromUpstream<T>(
  request: (init: AuthorizedInit) => Promise<UpstreamResult<T>>,
  returnTo: string
): Promise<T> {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect("/login");
  }

  const { data, response } = await request({
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });

  if (response.status === 401) {
    if (returnTo.includes(`${REFRESHED_PARAM}=`)) {
      redirect("/login");
    }
    redirect(`/api/auth/refresh?returnTo=${encodeURIComponent(returnTo)}`);
  }

  if (!response.ok || data === undefined) {
    // Erros que não são de sessão sobem para o error boundary da rota: o
    // helper cuida de autenticação, não de tratamento de falha de domínio.
    throw new Error(
      `Upstream request failed with status ${String(response.status)}`
    );
  }

  return data;
}
