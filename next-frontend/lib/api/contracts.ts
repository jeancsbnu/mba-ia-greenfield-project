/**
 * BFF ↔ Components contracts barrel.
 *
 * This file is the **only** module in the project authorized to import `paths`
 * from `./types.gen`. Every Route Handler and every Component consumes BFF
 * shapes via named aliases exported from here — never by indexing `paths`
 * directly elsewhere.
 *
 * Two alias forms by convention:
 *
 * 1. **Pass-through alias** — BFF returns the upstream NestJS shape as-is.
 *    The alias indexes `paths` for the route's success-content type:
 *
 *      export type Video =
 *        paths["/videos/{id}"]["get"]["responses"][200]["content"]["application/json"];
 *
 * 2. **Reshape alias** — BFF projects a subset or composed shape. The alias
 *    name is named-only (does NOT index `paths`), making reshapes greppable
 *    against the wire shape:
 *
 *      export type VideoCard = Pick<Video, "id" | "title" | "thumbnailUrl">;
 *
 * Feature SIs append aliases here as endpoints are wired through the BFF.
 * The barrel starts empty by design.
 */
import type { paths } from "./types.gen";

// ─── Auth ─────────────────────────────────────────────────────────────────────

// Request bodies (populados desde que o openapi:export passou a rodar via
// `nest build`, que é o que ativa o plugin do Swagger — antes disso todo DTO de
// requisição saía sem propriedades)
export type RegisterDto =
  paths["/auth/register"]["post"]["requestBody"]["content"]["application/json"];

export type LoginDto =
  paths["/auth/login"]["post"]["requestBody"]["content"]["application/json"];

export type ForgotPasswordDto =
  paths["/auth/forgot-password"]["post"]["requestBody"]["content"]["application/json"];

export type RefreshTokenDto =
  paths["/auth/refresh"]["post"]["requestBody"]["content"]["application/json"];

// Upstream success response bodies
export type RegisterResponse =
  paths["/auth/register"]["post"]["responses"][201]["content"]["application/json"];

// LoginTokenPair: upstream 200 body — BFF reads it to seal into the iron-session cookie;
// tokens never cross to the browser (per phase-02-auth-frontend/TD-02).
export type LoginTokenPair =
  paths["/auth/login"]["post"]["responses"][200]["content"]["application/json"];

export type RefreshTokenPair =
  paths["/auth/refresh"]["post"]["responses"][200]["content"]["application/json"];

// Shared error envelope (all auth 4xx responses)
export type ApiErrorEnvelope =
  paths["/auth/register"]["post"]["responses"][400]["content"]["application/json"];

// ─── Videos ─────────────────────────────────────────────────────────────────

// Pass-through alias — BFF returns the upstream shape as-is.
export type Video =
  paths["/videos/{publicId}"]["get"]["responses"][200]["content"]["application/json"];

export type UpdateVideoDto =
  paths["/videos/{publicId}"]["patch"]["requestBody"]["content"]["multipart/form-data"];

// A categoria vem do enum do backend (TD-10): derivá-la do contrato impede que
// a lista do formulário e a aceita pela API divirjam.
export type VideoCategory = NonNullable<UpdateVideoDto["category"]>;

export type VideoVisibility = NonNullable<UpdateVideoDto["visibility"]>;

// Painel do dono — inclui rascunhos, status e contadores.
export type OwnerVideosPage =
  paths["/me/videos"]["get"]["responses"][200]["content"]["application/json"];

export type OwnerVideoListItem = OwnerVideosPage["items"][number];

// ─── Channels ───────────────────────────────────────────────────────────────

export type Channel =
  paths["/me/channel"]["get"]["responses"][200]["content"]["application/json"];

export type UpdateChannelDto =
  paths["/me/channel"]["patch"]["requestBody"]["content"]["application/json"];

// Vitrine pública: forma distinta da do dono — acrescenta videosCount e não
// expõe status nem visibilidade.
export type PublicChannel =
  paths["/channels/{nickname}"]["get"]["responses"][200]["content"]["application/json"];

export type PublicVideosPage =
  paths["/channels/{nickname}/videos"]["get"]["responses"][200]["content"]["application/json"];

export type PublicVideoListItem = PublicVideosPage["items"][number];

// ─── Watch page (Fase 05) ───────────────────────────────────────────────────

// Projeção pública do vídeo. Distinta de `Video`, que é a leitura do dono:
// esta não carrega campos de operação e acrescenta as duas URLs pré-assinadas
// de 6 h, entregues juntas porque o atributo `download` do HTML é ignorado
// cross-origin (video-watch-page/TD-02, Clarification de 2026-09-24).
export type PublicVideo =
  paths["/videos/{publicId}/public"]["get"]["responses"][200]["content"]["application/json"];

export type PublicVideoChannel = PublicVideo["channel"];

// Sidebar de sugestões: `{ items, total }`, sem offset/limit no corpo.
export type SuggestedVideosPage =
  paths["/videos/{publicId}/suggestions"]["get"]["responses"][200]["content"]["application/json"];

export type SuggestedVideoListItem = SuggestedVideosPage["items"][number];

// ─── Interações sociais (Fase 06) ───────────────────────────────────────────

// Uma reação por usuário por alvo (social-interactions/TD-01). Não há contagem
// de dislikes em nenhuma forma — só o estado do próprio visitante (TD-03).
export type SetReactionDto =
  paths["/videos/{publicId}/reaction"]["put"]["requestBody"]["content"]["application/json"];

export type ReactionType = SetReactionDto["type"];

// Mesma forma para reação em vídeo e em comentário.
export type ReactionState =
  paths["/videos/{publicId}/reaction"]["put"]["responses"][200]["content"]["application/json"];

// Raízes mais recentes primeiro, com até 3 respostas pré-carregadas
// (social-interactions/TD-05).
export type CommentsPage =
  paths["/videos/{publicId}/comments"]["get"]["responses"][200]["content"]["application/json"];

export type CommentThread = CommentsPage["items"][number];

export type Comment =
  paths["/videos/{publicId}/comments"]["post"]["responses"][201]["content"]["application/json"];

export type CreateCommentDto =
  paths["/videos/{publicId}/comments"]["post"]["requestBody"]["content"]["application/json"];

export type RepliesPage =
  paths["/comments/{commentId}/replies"]["get"]["responses"][200]["content"]["application/json"];

export type SubscriptionState =
  paths["/channels/{nickname}/subscription"]["put"]["responses"][200]["content"]["application/json"];

// Área de canais seguidos: lista de canais, não feed (social-interactions/TD-07).
export type SubscribedChannelsPage =
  paths["/me/subscriptions"]["get"]["responses"][200]["content"]["application/json"];

export type SubscribedChannel = SubscribedChannelsPage["items"][number];
