import { NextResponse } from "next/server";

import type {
  ApiErrorEnvelope,
  SuggestedVideosPage,
} from "@/lib/api/contracts";
import { upstream } from "@/lib/api/upstream";

// Sidebar de sugestões. offset/limit são pass-through: a validação do recorte
// é do upstream (Validation Rules de GET /videos/{publicId}/suggestions), e
// duplicá-la aqui criaria duas fontes de verdade que divergiriam.
export async function GET(
  request: Request,
  ctx: RouteContext<"/api/videos/[publicId]/suggestions">
) {
  const { publicId } = await ctx.params;
  const searchParams = new URL(request.url).searchParams;

  const offset = searchParams.get("offset");
  const limit = searchParams.get("limit");

  const { data, error, response } = await upstream.GET(
    "/videos/{publicId}/suggestions",
    {
      params: {
        path: { publicId },
        query: {
          ...(offset !== null && { offset: Number(offset) }),
          ...(limit !== null && { limit: Number(limit) }),
        },
      },
    }
  );

  if (error) {
    return NextResponse.json<ApiErrorEnvelope>(error as ApiErrorEnvelope, {
      status: response.status,
    });
  }
  return NextResponse.json<SuggestedVideosPage>(data, {
    status: response.status,
  });
}
