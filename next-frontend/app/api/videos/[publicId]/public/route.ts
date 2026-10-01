import { NextResponse } from "next/server";

import type { ApiErrorEnvelope, PublicVideo } from "@/lib/api/contracts";
import { upstream } from "@/lib/api/upstream";

// Leitura pública da watch page. Sem sessão e sem withRefresh, ao contrário do
// GET irmão em ../route.ts: a rota upstream é @Public() e o visitante anônimo
// é o caso principal, não a exceção. O GET do dono continua onde estava —
// serve o polling de status do painel e exige posse.
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/videos/[publicId]/public">
) {
  const { publicId } = await ctx.params;

  const { data, error, response } = await upstream.GET(
    "/videos/{publicId}/public",
    { params: { path: { publicId } } }
  );

  // Status e corpo do upstream são repassados sem reformatar: o mapeamento
  // para UX é responsabilidade do componente, não do BFF.
  if (error) {
    return NextResponse.json<ApiErrorEnvelope>(error as ApiErrorEnvelope, {
      status: response.status,
    });
  }
  return NextResponse.json<PublicVideo>(data, { status: response.status });
}
