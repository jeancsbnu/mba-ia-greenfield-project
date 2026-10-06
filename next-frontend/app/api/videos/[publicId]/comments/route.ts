import { NextResponse, type NextRequest } from "next/server";

import type {
  ApiErrorEnvelope,
  Comment,
  CommentsPage,
  CreateCommentDto,
} from "@/lib/api/contracts";
import { fetchWithOptionalAuth } from "@/lib/api/optional-auth";
import { upstream } from "@/lib/api/upstream";
import { withRefresh } from "@/lib/auth/refresh";
import { getSession } from "@/lib/auth/session";

type Context = RouteContext<"/api/videos/[publicId]/comments">;

function errorResponse(error: unknown, response: Response): Response {
  return NextResponse.json<ApiErrorEnvelope>(error as ApiErrorEnvelope, {
    status: response.status,
  });
}

// Páginas seguintes de comentários (a primeira vem no render do Server
// Component). Auth opcional: com sessão, o upstream preenche viewerReaction;
// um 401 vira chamada anônima e nunca chega ao browser
// (social-interactions-anonymous-gate/TD-02).
export async function GET(request: NextRequest, ctx: Context) {
  const { publicId } = await ctx.params;
  const search = request.nextUrl.searchParams;
  const offset = search.get("offset");
  const limit = search.get("limit");

  const { data, error, response } = await fetchWithOptionalAuth((init) =>
    upstream.GET("/videos/{publicId}/comments", {
      params: {
        path: { publicId },
        query: {
          ...(offset !== null && { offset: Number(offset) }),
          ...(limit !== null && { limit: Number(limit) }),
        },
      },
      ...init,
    })
  );

  if (error) {
    return errorResponse(error, response);
  }
  return NextResponse.json<CommentsPage>(data, { status: response.status });
}

// Publicação de comentário ou resposta: Bearer da sessão e um refresh no 401
// (phase-02-auth-frontend/TD-02 e TD-03). Pass-through do 201 e dos erros.
export async function POST(request: Request, ctx: Context) {
  const { publicId } = await ctx.params;
  // Lido uma vez só: withRefresh pode reexecutar o fetcher após o refresh.
  const body = (await request.json()) as CreateCommentDto;

  return withRefresh(async () => {
    const session = await getSession();
    const { data, error, response } = await upstream.POST(
      "/videos/{publicId}/comments",
      {
        params: { path: { publicId } },
        headers: { Authorization: `Bearer ${session.accessToken}` },
        body,
      }
    );

    if (error) {
      return errorResponse(error, response);
    }
    return NextResponse.json<Comment>(data, { status: response.status });
  });
}
