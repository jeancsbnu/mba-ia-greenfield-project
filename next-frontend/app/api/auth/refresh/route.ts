import { NextResponse, type NextRequest } from "next/server";

import { refreshOnce } from "@/lib/auth/refresh";
import { DEFAULT_RETURN_TO, REFRESHED_PARAM } from "@/lib/auth/refresh-redirect";

/**
 * Só caminhos internos são aceitos. `//host` e `/\host` são rejeitados porque o
 * navegador os trata como URL protocol-relative — seriam um open redirect.
 */
function safeReturnTo(raw: string | null): string {
  if (!raw || !raw.startsWith("/")) return DEFAULT_RETURN_TO;
  if (raw.startsWith("//") || raw.startsWith("/\\")) return DEFAULT_RETURN_TO;
  return raw;
}

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
