import { NextResponse } from "next/server";

import type { ApiErrorEnvelope, Channel, UpdateChannelDto } from "@/lib/api/contracts";
import { upstream } from "@/lib/api/upstream";
import { withRefresh } from "@/lib/auth/refresh";
import { getSession } from "@/lib/auth/session";

export async function PATCH(request: Request) {
  // Lido uma vez só: withRefresh pode reexecutar o fetcher após o refresh, e um
  // Request já consumido não pode ser lido de novo.
  const body = (await request.json()) as UpdateChannelDto;

  const patchChannel = async () => {
    const session = await getSession();

    const { data, error, response } = await upstream.PATCH("/me/channel", {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      body,
    });

    // Status e corpo do upstream passam sem reformatar: traduzir 409 em texto
    // de UI é responsabilidade do componente, não do BFF.
    if (error) {
      return NextResponse.json<ApiErrorEnvelope>(error as ApiErrorEnvelope, {
        status: response.status,
      });
    }
    return NextResponse.json<Channel>(data, { status: response.status });
  };

  return withRefresh(patchChannel);
}
