import type { paths } from "@/lib/api/types.gen";

type PublicVideo =
  paths["/videos/{publicId}/public"]["get"]["responses"][200]["content"]["application/json"];
type PublicChannel =
  paths["/channels/{nickname}"]["get"]["responses"][200]["content"]["application/json"];
export type SubscribedChannel =
  paths["/me/subscriptions"]["get"]["responses"][200]["content"]["application/json"]["items"][number];

// Reserved trigger table da Fase 06, compartilhada entre Vitest e E2E e
// declarada nas specs next-frontend/specs/video-watch-social.plan.md,
// channel-subscriptions.plan.md e channel-public-subscription.plan.md. Não
// colide com os triggers das fases anteriores.
export const SOCIAL_VIDEO_PUBLIC_ID = "social-video";
export const LIKED_VIDEO_PUBLIC_ID = "liked-video";
export const REACTION_FAILS_PUBLIC_ID = "reaction-fails-video";
export const QUIET_VIDEO_PUBLIC_ID = "quiet-video";

export const SOCIAL_CHANNEL_NICKNAME = "maria_rocha";
export const FOLLOWED_CHANNEL_NICKNAME = "canal_seguido";
export const SUBSCRIPTION_LIMITED_NICKNAME = "limite_inscricao";
export const NO_SUBSCRIPTIONS_EMAIL = "no-subscriptions@example.com";

export const SOCIAL_VIDEO_LIKES = 128;
export const SOCIAL_VIDEO_COMMENTS = 12;
export const SOCIAL_CHANNEL_SUBSCRIBERS = 1200;

const SOCIAL_VIDEO_IDS = new Set([
  SOCIAL_VIDEO_PUBLIC_ID,
  LIKED_VIDEO_PUBLIC_ID,
  REACTION_FAILS_PUBLIC_ID,
  QUIET_VIDEO_PUBLIC_ID,
]);

/**
 * Campos sociais do detalhe público para os triggers da watch page. Sem
 * trigger, devolve nada (o fixture base, com estado neutro, vale).
 */
export function socialVideoOverrides(
  publicId: string,
  authorized: boolean
): Partial<PublicVideo> {
  if (!SOCIAL_VIDEO_IDS.has(publicId)) {
    return {};
  }
  const liked = publicId === LIKED_VIDEO_PUBLIC_ID && authorized;
  return {
    likesCount: SOCIAL_VIDEO_LIKES,
    commentsCount: publicId === QUIET_VIDEO_PUBLIC_ID ? 0 : SOCIAL_VIDEO_COMMENTS,
    viewerReaction: liked ? "like" : null,
    channel: {
      nickname: SOCIAL_CHANNEL_NICKNAME,
      name: "Maria Rocha",
      subscribersCount: SOCIAL_CHANNEL_SUBSCRIBERS,
      viewerSubscribed: liked,
    },
  };
}

/** Contagem de inscritos de base de um canal, antes de qualquer toggle. */
export function baseSubscribers(nickname: string): number {
  return nickname === SOCIAL_CHANNEL_NICKNAME ? SOCIAL_CHANNEL_SUBSCRIBERS : 0;
}

/** Campos sociais da leitura pública do canal para os triggers da fase. */
export function socialChannelOverrides(
  nickname: string,
  authorized: boolean
): Partial<PublicChannel> {
  return {
    subscribersCount: baseSubscribers(nickname),
    viewerSubscribed: nickname === FOLLOWED_CHANNEL_NICKNAME && authorized,
    ...(nickname === SOCIAL_CHANNEL_NICKNAME && { name: "Maria Rocha" }),
  };
}

/** Os 3 canais seguidos por `user@example.com`, inscrição mais recente primeiro. */
export function buildSubscribedChannels(): SubscribedChannel[] {
  return [
    { name: "Ana Costa", nickname: "ana_costa", subscribersCount: 87, videosCount: 9 },
    {
      name: "Diego Farias",
      nickname: "diego_farias",
      subscribersCount: 4300,
      videosCount: 18,
    },
    {
      name: "Maria Rocha",
      nickname: SOCIAL_CHANNEL_NICKNAME,
      subscribersCount: SOCIAL_CHANNEL_SUBSCRIBERS,
      videosCount: 42,
    },
  ];
}
