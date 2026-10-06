import { NextResponse } from "next/server";

import type {
  ApiErrorEnvelope,
  ReactionState,
  SetReactionDto,
} from "@/lib/api/contracts";
import { upstream } from "@/lib/api/upstream";
import { withRefresh } from "@/lib/auth/refresh";
import { getSession } from "@/lib/auth/session";

type Context = RouteContext<"/api/comments/[commentId]/reaction">;

// Mesmo contrato da reação em vídeo, aplicado a comentário ou resposta.
// Pass-through de status e corpo; Bearer da sessão e um refresh no 401
// (phase-02-auth-frontend/TD-02 e TD-03).
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
  const { commentId } = await ctx.params;
  // Lido uma vez só: withRefresh pode reexecutar o fetcher após o refresh.
  const body = (await request.json()) as SetReactionDto;

  return withRefresh(async () => {
    const session = await getSession();
    const { data, error, response } = await upstream.PUT(
      "/comments/{commentId}/reaction",
      {
        params: { path: { commentId } },
        headers: { Authorization: `Bearer ${session.accessToken}` },
        body,
      }
    );
    return passThrough(data, error, response);
  });
}

export async function DELETE(_request: Request, ctx: Context) {
  const { commentId } = await ctx.params;

  return withRefresh(async () => {
    const session = await getSession();
    const { data, error, response } = await upstream.DELETE(
      "/comments/{commentId}/reaction",
      {
        params: { path: { commentId } },
        headers: { Authorization: `Bearer ${session.accessToken}` },
      }
    );
    return passThrough(data, error, response);
  });
}
