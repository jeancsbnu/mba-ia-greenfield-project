import { NextResponse, type NextRequest } from "next/server";

import { refreshOnce } from "@/lib/auth/refresh";
import { REFRESHED_PARAM } from "@/lib/auth/refresh-redirect";
import { safeReturnTo } from "@/lib/auth/return-to";

function withRefreshedMark(path: string, origin: string): URL {
  const url = new URL(path, origin);
  url.searchParams.set(REFRESHED_PARAM, "1");
  return url;
}

export async function GET(request: NextRequest) {
  const returnTo = safeReturnTo(request.nextUrl.searchParams.get("returnTo"));

  const refreshed = await refreshOnce();

  if (!refreshed) {
    // refreshOnce já destruiu a sessão no caminho de falha.
    return NextResponse.redirect(new URL("/login", request.nextUrl.origin));
  }

  return NextResponse.redirect(
    withRefreshedMark(returnTo, request.nextUrl.origin)
  );
}
