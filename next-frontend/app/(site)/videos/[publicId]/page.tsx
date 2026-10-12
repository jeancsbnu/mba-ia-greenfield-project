import Link from "next/link"
import { notFound } from "next/navigation"

import {
  ChannelSubscriptionProvider,
  ProvidedSubscriberCount,
} from "@/components/channels/channel-subscription-provider"
import { SubscribeButton } from "@/components/channels/subscribe-button"
import { CommentsSection } from "@/components/comments/comments-section"
import { DownloadIcon } from "@/components/icons/download-icon"
import { PublicSiteNavbar } from "@/components/layout/public-site-navbar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { SidebarLoadMore } from "@/components/videos/sidebar-load-more"
import { VideoCard } from "@/components/videos/video-card"
import { VideoDescription } from "@/components/videos/video-description"
import { VideoPlayer } from "@/components/videos/video-player"
import { VideoReactions } from "@/components/videos/video-reactions"
import type {
  CommentsPage,
  PublicVideo,
  SuggestedVideosPage,
} from "@/lib/api/contracts"
import { fetchWithOptionalAuth } from "@/lib/api/optional-auth"
import { upstream } from "@/lib/api/upstream"
import { getViewerChannel } from "@/lib/api/viewer-channel"
import { getSession } from "@/lib/auth/session"
import { formatCount, formatRelativeDate } from "@/lib/format"
import { SUGGESTIONS_PAGE_SIZE } from "@/lib/pagination"

// Rótulo do heading da sidebar: "MAIS EM {CATEGORIA}" nas sete categorias
// nomeadas, "MAIS VÍDEOS" no catch-all "Outros" — dizer "MAIS EM OUTROS" não
// significa nada para o espectador.
function suggestionsHeading(category: string): string {
  return category === "Outros"
    ? "MAIS VÍDEOS"
    : `MAIS EM ${category.toLocaleUpperCase("pt-BR")}`
}

// Iniciais do canal: não há upload de avatar nesta fase, então o fallback é o
// que sempre renderiza.
function channelInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toLocaleUpperCase("pt-BR") ?? "")
    .join("")
}

export default async function VideoWatchPage({
  params,
}: {
  params: Promise<{ publicId: string }>
}) {
  const { publicId } = await params

  // Página pública: o Server Component fala direto com o upstream — o modelo
  // strict-BFF governa o tráfego do NAVEGADOR, e `env.API_URL` é server-only.
  // O detalhe sai com auth opcional, para o estado pessoal (meu like, minha
  // inscrição) chegar na primeira pintura, sem piscar do neutro para o real
  // (social-interactions-anonymous-gate/TD-02).
  const session = await getSession()
  const isAuthenticated = session.isLoggedIn === true
  const [detailResult, suggestionsResult, commentsResult, viewer] =
    await Promise.all([
      fetchWithOptionalAuth((init) =>
        upstream.GET("/videos/{publicId}/public", {
          params: { path: { publicId } },
          ...init,
        })
      ),
      upstream.GET("/videos/{publicId}/suggestions", {
        params: { path: { publicId }, query: { limit: SUGGESTIONS_PAGE_SIZE } },
      }),
      // Primeira página de comentários no render, com o estado pessoal; as
      // seguintes vêm pela rota BFF (social-interactions/TD-05).
      fetchWithOptionalAuth((init) =>
        upstream.GET("/videos/{publicId}/comments", {
          params: { path: { publicId } },
          ...init,
        })
      ),
      getViewerChannel(),
    ])

  // VIDEO_NOT_FOUND e VIDEO_NOT_READY caem na mesma tela: o texto cobre
  // "ainda não publicado" sem revelar a causa (§Error Catalog → UX mapping).
  if (detailResult.error || detailResult.data === undefined) {
    notFound()
  }

  const video = detailResult.data as PublicVideo
  // Falha nas sugestões degrada só a sidebar — o player continua de pé.
  const suggestions = (suggestionsResult.data ?? {
    items: [],
    total: 0,
  }) as SuggestedVideosPage
  // publishedAt é nulo quando quem assiste é o dono olhando o próprio
  // rascunho — o único caminho em que a rota serve um não-publicado.
  const published =
    video.publishedAt === null ? null : formatRelativeDate(video.publishedAt)

  return (
    <div className="flex min-h-screen flex-col">
      <PublicSiteNavbar />

      <main className="flex flex-1 flex-col gap-6 px-12 py-12 lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <VideoPlayer
            src={video.streamUrl}
            title={video.title}
            publicId={video.publicId}
          />

          <div className="flex flex-col gap-1.5">
            <h1 className="text-h1 text-foreground">{video.title}</h1>
            <p className="text-caption text-muted-foreground">
              <span>{`${formatCount(video.viewsCount)} visualizações`}</span>
              {published !== null && video.publishedAt !== null ? (
                <>
                  <span>{" · "}</span>
                  <time dateTime={video.publishedAt} title={published.absolute}>
                    {published.absolute}
                  </time>
                </>
              ) : null}
            </p>
          </div>

          {/* Faixa do canal (Figma `channel-row` 77:94): identidade +
              inscrição de um lado, download e reações do outro. Botão e
              contagem de inscritos dividem o estado otimista do provider
              (social-interactions/TD-08). */}
          <ChannelSubscriptionProvider
            nickname={video.channel.nickname}
            initialSubscribed={video.channel.viewerSubscribed}
            initialSubscribersCount={video.channel.subscribersCount}
            isAuthenticated={isAuthenticated}
          >
            <div className="flex flex-wrap items-center justify-between gap-4 border-y border-border py-4">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar size="lg">
                  <AvatarFallback>
                    {channelInitials(video.channel.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-label-md text-foreground">
                    {video.channel.name}
                  </span>
                  <Link
                    href={`/@${video.channel.nickname}`}
                    className="truncate text-caption text-muted-foreground hover:underline"
                  >
                    {`@${video.channel.nickname}`}
                  </Link>
                  <span className="truncate text-caption text-muted-foreground">
                    <ProvidedSubscriberCount />
                  </span>
                </div>
                <SubscribeButton />
              </div>

              {/* Um <a download> sobre a URL que JÁ veio com a página: sem
                chamada em tempo de clique (TD-02, Clarification de
                2026-09-24). O atributo `download` é ignorado cross-origin —
                quem força o salvamento é o content-disposition assinado. */}
              <div className="flex flex-wrap items-start gap-2">
                <Button asChild variant="secondary">
                  <a href={video.downloadUrl} download>
                    <DownloadIcon className="size-3.5" />
                    Baixar vídeo
                  </a>
                </Button>
                <VideoReactions
                  publicId={video.publicId}
                  initialReaction={video.viewerReaction}
                  initialLikesCount={video.likesCount}
                  isAuthenticated={isAuthenticated}
                />
              </div>
            </div>
          </ChannelSubscriptionProvider>

          <VideoDescription description={video.description} />

          {/* Falha na leitura dos comentários degrada só a seção — o player
              continua de pé, mesmo critério das sugestões. */}
          <CommentsSection
            publicId={video.publicId}
            initialPage={
              (commentsResult.data as CommentsPage | undefined) ?? null
            }
            commentsCount={video.commentsCount}
            isAuthenticated={isAuthenticated}
            viewerName={viewer?.name}
          />
        </div>

        <aside className="flex w-full shrink-0 flex-col gap-3.5 lg:w-suggestions-sidebar">
          <h2 className="text-caption font-weight-700 text-muted-foreground">
            {suggestionsHeading(video.category)}
          </h2>

          {suggestions.items.length === 0 ? (
            // Sidebar vazia é resultado legítimo e frequente, não caso de
            // borda: o TD-04 exclui o vídeo atual, rascunhos e `unlisted`,
            // então uma categoria com um único publicado produz lista vazia.
            <p className="text-caption text-muted-foreground">
              Nenhuma sugestão nesta categoria
            </p>
          ) : (
            <ul className="flex flex-col gap-3.5">
              {suggestions.items.map((item) => (
                <li key={item.publicId}>
                  <Link href={`/videos/${item.publicId}`}>
                    <VideoCard
                      title={item.title}
                      thumbnailUrl={item.thumbnailUrl}
                      durationSeconds={item.durationSeconds}
                      viewsCount={item.viewsCount}
                      publishedAt={formatRelativeDate(item.publishedAt).label}
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <SidebarLoadMore
            publicId={video.publicId}
            initialCount={suggestions.items.length}
            total={suggestions.total}
          />
        </aside>
      </main>
    </div>
  )
}
