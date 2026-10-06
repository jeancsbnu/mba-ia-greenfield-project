import { NextResponse, type NextRequest } from "next/server";

import type { ApiErrorEnvelope, RepliesPage } from "@/lib/api/contracts";
import { fetchWithOptionalAuth } from "@/lib/api/optional-auth";
import { upstream } from "@/lib/api/upstream";

// "Ver mais N respostas": respostas além das pré-carregadas. Auth opcional,
// como a listagem de comentários (social-interactions-anonymous-gate/TD-02).
export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/comments/[commentId]/replies">
) {
  const { commentId } = await ctx.params;
  const search = request.nextUrl.searchParams;
  const offset = search.get("offset");
  const limit = search.get("limit");

  const { data, error, response } = await fetchWithOptionalAuth((init) =>
    upstream.GET("/comments/{commentId}/replies", {
      params: {
        path: { commentId },
        query: {
          ...(offset !== null && { offset: Number(offset) }),
          ...(limit !== null && { limit: Number(limit) }),
        },
      },
      ...init,
    })
  );

  if (error) {
    return NextResponse.json<ApiErrorEnvelope>(error as ApiErrorEnvelope, {
      status: response.status,
    });
  }
  return NextResponse.json<RepliesPage>(data, { status: response.status });
}
