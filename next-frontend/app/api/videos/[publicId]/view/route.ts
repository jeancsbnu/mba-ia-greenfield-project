import { NextResponse } from "next/server";

import type { ApiErrorEnvelope } from "@/lib/api/contracts";
import { upstream } from "@/lib/api/upstream";

// Contagem de visualização: disparada pelo player uma vez por montagem, depois
// do limiar de reprodução efetiva (video-watch-page/TD-03, Option B). Sem
// corpo e sem autenticação. O 429 do orçamento próprio da rota (30/60 s por
// IP, TD-05) é repassado tal como vem.
export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/videos/[publicId]/view">
) {
  const { publicId } = await ctx.params;

  const { error, response } = await upstream.POST("/videos/{publicId}/view", {
    params: { path: { publicId } },
  });

  if (error) {
    return NextResponse.json<ApiErrorEnvelope>(error as ApiErrorEnvelope, {
      status: response.status,
    });
  }
  // 204 não carrega corpo; devolver um NextResponse.json aqui produziria um
  // 204 com body, que o fetch do browser rejeita.
  return new Response(null, { status: response.status });
}
