import { env } from "@/lib/env";
import { withRefresh } from "@/lib/auth/refresh";
import { getSession } from "@/lib/auth/session";

const FORWARD_REQUEST_HEADERS = [
  "tus-resumable",
  "upload-length",
  "upload-metadata",
  "upload-offset",
  "content-type",
];

const FORWARD_RESPONSE_HEADERS = [
  "tus-resumable",
  "tus-version",
  "tus-extension",
  "tus-max-size",
  "upload-offset",
  "upload-length",
  "upload-metadata",
  "content-type",
];

async function proxyTus(
  request: Request,
  path: string[] | undefined,
  method: string
): Promise<Response> {
  const segments = path ?? [];
  const upstreamUrl = `${env.API_URL}/videos/upload${
    segments.length ? `/${segments.join("/")}` : ""
  }`;

  const body =
    method === "POST" || method === "PATCH"
      ? await request.arrayBuffer()
      : undefined;

  const fetchUpstream = async () => {
    const session = await getSession();
    const headers = new Headers();
    for (const name of FORWARD_REQUEST_HEADERS) {
      const value = request.headers.get(name);
      if (value !== null) headers.set(name, value);
    }
    headers.set("Authorization", `Bearer ${session.accessToken}`);

    return fetch(upstreamUrl, { method, headers, body });
  };

  const upstreamResponse = await withRefresh(fetchUpstream);

  const responseHeaders = new Headers();
  for (const name of FORWARD_RESPONSE_HEADERS) {
    const value = upstreamResponse.headers.get(name);
    if (value !== null) responseHeaders.set(name, value);
  }

  const location = upstreamResponse.headers.get("location");
  if (location) {
    const upstreamPath = new URL(location, env.API_URL).pathname;
    responseHeaders.set("location", `/api${upstreamPath}`);
  }

  const responseBody = await upstreamResponse.text();
  if (responseBody.length > 0 && !responseHeaders.has("content-type")) {
    responseHeaders.set("content-type", "application/json");
  }

  return new Response(responseBody.length ? responseBody : null, {
    status: upstreamResponse.status,
    headers: responseHeaders,
  });
}

type UploadRouteContext = RouteContext<"/api/videos/upload/[[...path]]">;

export async function POST(request: Request, ctx: UploadRouteContext) {
  const { path } = await ctx.params;
  return proxyTus(request, path, "POST");
}

export async function PATCH(request: Request, ctx: UploadRouteContext) {
  const { path } = await ctx.params;
  return proxyTus(request, path, "PATCH");
}

export async function HEAD(request: Request, ctx: UploadRouteContext) {
  const { path } = await ctx.params;
  return proxyTus(request, path, "HEAD");
}

export async function DELETE(request: Request, ctx: UploadRouteContext) {
  const { path } = await ctx.params;
  return proxyTus(request, path, "DELETE");
}

export async function OPTIONS(request: Request, ctx: UploadRouteContext) {
  const { path } = await ctx.params;
  return proxyTus(request, path, "OPTIONS");
}
