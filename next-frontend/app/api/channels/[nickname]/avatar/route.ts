import { upstream } from "@/lib/api/upstream";

// Repassa a leitura pública da foto do canal: o Nest responde 302 para a URL
// assinada do storage, ou 404 quando o canal não tem foto. O redirect não é
// seguido aqui — o navegador busca a imagem direto no storage, como já faz
// com vídeos e thumbnails.
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/channels/[nickname]/avatar">
) {
  const { nickname } = await ctx.params;

  const { response } = await upstream.GET("/channels/{nickname}/avatar", {
    params: { path: { nickname } },
    redirect: "manual",
  });

  const location = response.headers.get("location");
  if (response.status === 302 && location) {
    return new Response(null, {
      status: 302,
      headers: { Location: location, "Cache-Control": "no-store" },
    });
  }

  // 404 (sem foto, canal inexistente) ou falha: o <img> cai nas iniciais.
  return new Response(null, {
    status: response.status === 302 ? 502 : response.status,
    headers: { "Cache-Control": "no-store" },
  });
}
