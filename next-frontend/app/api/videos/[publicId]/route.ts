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
