import { NextResponse } from "next/server";

import type { ApiErrorEnvelope, SubscriptionState } from "@/lib/api/contracts";
import { upstream } from "@/lib/api/upstream";
import { withRefresh } from "@/lib/auth/refresh";
import { getSession } from "@/lib/auth/session";

type Context = RouteContext<"/api/channels/[nickname]/subscription">;

// Par de mutações de inscrição, consumido pelo SubscribeButton das duas telas
// públicas e pelo SubscriptionToggleButton da área de canais seguidos. Bearer
// da sessão server-side e um refresh no 401 (phase-02-auth-frontend/TD-02 e
// TD-03); status e corpo do upstream passam sem reformatar.
function passThrough(
  data: SubscriptionState | undefined,
  error: unknown,
  response: Response
): Response {
  if (error) {
    return NextResponse.json<ApiErrorEnvelope>(error as ApiErrorEnvelope, {
      status: response.status,
    });
  }
  return NextResponse.json<SubscriptionState>(data as SubscriptionState, {
    status: response.status,
  });
}

export async function PUT(_request: Request, ctx: Context) {
  const { nickname } = await ctx.params;

  return withRefresh(async () => {
    const session = await getSession();
    const { data, error, response } = await upstream.PUT(
      "/channels/{nickname}/subscription",
      {
        params: { path: { nickname } },
        headers: { Authorization: `Bearer ${session.accessToken}` },
      }
    );
    return passThrough(data, error, response);
  });
}

export async function DELETE(_request: Request, ctx: Context) {
  const { nickname } = await ctx.params;

  return withRefresh(async () => {
    const session = await getSession();
    const { data, error, response } = await upstream.DELETE(
      "/channels/{nickname}/subscription",
      {
        params: { path: { nickname } },
        headers: { Authorization: `Bearer ${session.accessToken}` },
      }
    );
    return passThrough(data, error, response);
  });
}
