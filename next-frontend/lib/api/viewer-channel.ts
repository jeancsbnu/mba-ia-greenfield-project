import "server-only";

import { cache } from "react";

import type { Channel } from "@/lib/api/contracts";
import { fetchWithOptionalAuth } from "@/lib/api/optional-auth";
import { upstream } from "@/lib/api/upstream";
import { getSession } from "@/lib/auth/session";

/**
 * Canal de quem está vendo uma página pública, ou `null` sem sessão ou quando a
 * leitura falha — nunca derruba a página. Memoizado por requisição com
 * `cache()`: o navbar e o compositor de comentários leem o mesmo valor sem
 * duas chamadas a GET /me/channel.
 */
export const getViewerChannel = cache(async (): Promise<Channel | null> => {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return null;
  }
  const { data } = await fetchWithOptionalAuth((init) =>
    upstream.GET("/me/channel", init),
  );
  return data ?? null;
});
