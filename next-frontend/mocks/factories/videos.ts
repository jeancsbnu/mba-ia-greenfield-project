import type { paths } from "@/lib/api/types.gen";

export type Video =
  paths["/videos/{publicId}"]["get"]["responses"][200]["content"]["application/json"];

export type OwnerVideoListItem =
  paths["/me/videos"]["get"]["responses"][200]["content"]["application/json"]["items"][number];

export type PublicVideoListItem =
  paths["/channels/{nickname}/videos"]["get"]["responses"][200]["content"]["application/json"]["items"][number];

const baseVideo: Video = {
  publicId: "fixture-video",
  title: "Fixture Video",
  description: "A fixture video for tests",
  status: "ready",
  durationSeconds: 42,
  createdAt: "2026-01-01T00:00:00.000Z",
  category: "Outros",
  visibility: "public",
  // Rascunho por padrão: publishedAt nulo é o estado inicial de todo upload.
  publishedAt: null,
  thumbnailUrl: null,
};

export const buildVideo = (overrides: Partial<Video> = {}): Video => ({
  ...baseVideo,
  ...overrides,
});

const baseOwnerVideoListItem: OwnerVideoListItem = {
  publicId: "fixture-owner-video",
  title: "Fixture Owner Video",
  durationSeconds: 42,
  // Todo vídeo tem thumbnail — auto-gerada pelo worker quando o dono não envia
  // uma (TD-04). Caminho local porque next/image exigiria remotePatterns.
  thumbnailUrl: "/window.svg",
  status: "ready",
  visibility: "public",
  publishedAt: "2026-01-01T00:00:00.000Z",
  category: "Outros",
  viewsCount: 0,
  likesCount: 0,
  commentsCount: 0,
};

export const buildOwnerVideoListItem = (
  overrides: Partial<OwnerVideoListItem> = {},
): OwnerVideoListItem => ({
  ...baseOwnerVideoListItem,
  ...overrides,
});

const basePublicVideoListItem: PublicVideoListItem = {
  publicId: "fixture-public-video",
  title: "Fixture Public Video",
  durationSeconds: 42,
  // A vitrine pública sempre tem thumbnail — auto-gerada pelo worker quando o
  // dono não envia uma (TD-04). Um null aqui não representaria nenhum vídeo
  // publicável e esconderia o <img> que a tela deve mostrar.
  // Caminho local: next/image exige remotePatterns para host remoto, e um
  // host fictício falharia na otimização.
  thumbnailUrl: "/window.svg",
  viewsCount: 1284,
  publishedAt: "2026-01-01T00:00:00.000Z",
};

export const buildPublicVideoListItem = (
  overrides: Partial<PublicVideoListItem> = {},
): PublicVideoListItem => ({
  ...basePublicVideoListItem,
  ...overrides,
});
