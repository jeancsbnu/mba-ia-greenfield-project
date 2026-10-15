import { NextResponse } from "next/server";

import type { ApiErrorEnvelope } from "@/lib/api/contracts";
import { upstream } from "@/lib/api/upstream";
import { withRefresh } from "@/lib/auth/refresh";
import { getSession } from "@/lib/auth/session";

export async function PUT(request: Request) {
  // Lido uma vez só: withRefresh pode reexecutar o fetcher após o refresh.
  const formData = await request.formData();

  const putAvatar = async () => {
    const session = await getSession();
    // Sem Content-Type manual: o boundary do multipart vem do FormData.
    const { error, response } = await upstream.PUT("/me/channel/avatar", {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      // O contrato descreve o campo do multipart; o openapi-fetch envia o
      // FormData como está.
      body: formData as unknown as { avatar: string },
    });

    if (error) {
      return NextResponse.json<ApiErrorEnvelope>(error as ApiErrorEnvelope, {
        status: response.status,
      });
    }
    return new Response(null, { status: 204 });
  };

  return withRefresh(putAvatar);
}

export async function DELETE() {
  const deleteAvatar = async () => {
    const session = await getSession();
    const { error, response } = await upstream.DELETE("/me/channel/avatar", {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });

    if (error) {
      return NextResponse.json<ApiErrorEnvelope>(error as ApiErrorEnvelope, {
        status: response.status,
      });
    }
    return new Response(null, { status: 204 });
  };

  return withRefresh(deleteAvatar);
}
