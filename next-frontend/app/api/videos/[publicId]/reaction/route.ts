import { NextResponse } from "next/server";

import type {
  ApiErrorEnvelope,
  ReactionState,
  SetReactionDto,
} from "@/lib/api/contracts";
import { upstream } from "@/lib/api/upstream";
import { withRefresh } from "@/lib/auth/refresh";
import { getSession } from "@/lib/auth/session";

type Context = RouteContext<"/api/videos/[publicId]/reaction">;

// Status e corpo do upstream passam sem reformatar: traduzir 429 ou 404 em
// texto de UI é do componente. O Bearer vem da sessão server-side — o token
// nunca cruza para o browser (phase-02-auth-frontend/TD-02) — e um 401 dispara
// um único refresh (TD-03).
function passThrough(
  data: ReactionState | undefined,
  error: unknown,
  response: Response
): Response {
  if (error) {
    return NextResponse.json<ApiErrorEnvelope>(error as ApiErrorEnvelope, {
      status: response.status,
    });
  }
  return NextResponse.json<ReactionState>(data as ReactionState, {
    status: response.status,
  });
}

export async function PUT(request: Request, ctx: Context) {
  const { publicId } = await ctx.params;
  // Lido uma vez só: withRefresh pode reexecutar o fetcher após o refresh, e um
  // Request já consumido não pode ser lido de novo.
  const body = (await request.json()) as SetReactionDto;

  return withRefresh(async () => {
    const session = await getSession();
    const { data, error, response } = await upstream.PUT(
      "/videos/{publicId}/reaction",
      {
        params: { path: { publicId } },
        headers: { Authorization: `Bearer ${session.accessToken}` },
        body,
      }
    );
    return passThrough(data, error, response);
  });
}

export async function DELETE(_request: Request, ctx: Context) {
  const { publicId } = await ctx.params;

  return withRefresh(async () => {
    const session = await getSession();
    const { data, error, response } = await upstream.DELETE(
      "/videos/{publicId}/reaction",
      {
        params: { path: { publicId } },
        headers: { Authorization: `Bearer ${session.accessToken}` },
      }
    );
    return passThrough(data, error, response);
  });
}
