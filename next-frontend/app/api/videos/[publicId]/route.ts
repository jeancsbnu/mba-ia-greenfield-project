import { NextResponse } from "next/server";

import type { ApiErrorEnvelope, Video } from "@/lib/api/contracts";
import { upstream } from "@/lib/api/upstream";
import { withRefresh } from "@/lib/auth/refresh";
import { getSession } from "@/lib/auth/session";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/videos/[publicId]">
) {
  const { publicId } = await ctx.params;

  const fetchVideo = async () => {
    const session = await getSession();
    const { data, error, response } = await upstream.GET(
      "/videos/{publicId}",
      {
        params: { path: { publicId } },
        headers: { Authorization: `Bearer ${session.accessToken}` },
      }
    );

    if (error) {
      return NextResponse.json<ApiErrorEnvelope>(error as ApiErrorEnvelope, {
        status: response.status,
      });
    }
    return NextResponse.json<Video>(data);
  };

  return withRefresh(fetchVideo);
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/videos/[publicId]">
) {
  const { publicId } = await ctx.params;

  // O corpo é lido uma vez só: withRefresh pode reexecutar o fetcher após o
  // refresh, e um Request já consumido não pode ser lido de novo.
  const formData = await request.formData();

  const patchVideo = async () => {
    const session = await getSession();

    // Sem Content-Type manual: o boundary do multipart é gerado pelo fetch a
    // partir do FormData, e defini-lo à mão quebraria o parsing no upstream.
    const { data, error, response } = await upstream.PATCH(
      "/videos/{publicId}",
      {
        params: { path: { publicId } },
        headers: { Authorization: `Bearer ${session.accessToken}` },
        body: formData as unknown as Record<string, never>,
      }
    );

    // Status e corpo do upstream são repassados sem reformatar: o mapeamento
    // para UX é responsabilidade do componente, não do BFF.
    if (error) {
      return NextResponse.json<ApiErrorEnvelope>(error as ApiErrorEnvelope, {
        status: response.status,
      });
    }
    return NextResponse.json<Video>(data, { status: response.status });
  };

  return withRefresh(patchVideo);
}
