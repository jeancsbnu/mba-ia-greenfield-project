import { http, HttpResponse } from "msw";

import type { paths } from "@/lib/api/types.gen";
import { env } from "@/lib/env";

import {
  baseSubscribers,
  buildSubscribedChannels,
  NO_SUBSCRIPTIONS_EMAIL,
  SUBSCRIPTION_LIMITED_NICKNAME,
} from "../factories/social";
import { emailFromAuthHeader } from "./auth";

type SubscriptionOk =
  paths["/channels/{nickname}/subscription"]["put"]["responses"][200]["content"]["application/json"];
type SubscribedChannelsOk =
  paths["/me/subscriptions"]["get"]["responses"][200]["content"]["application/json"];
type ApiErrorEnvelope =
  paths["/channels/{nickname}/subscription"]["put"]["responses"][429]["content"]["application/json"];

const DEFAULT_SUBSCRIPTIONS_LIMIT = 50;

function errorEnvelope(
  statusCode: number,
  error: string,
  message: string
): ApiErrorEnvelope {
  return { statusCode, error, message, code: null };
}

// Triggers reservados em ../factories/social.ts (compartilhados com o E2E).
// Sem estado entre requisições: PUT devolve a base + 1, DELETE a base − 1.
export const handlers = [
  http.put(`${env.API_URL}/channels/:nickname/subscription`, ({ params }) => {
    const nickname = params.nickname as string;
    if (nickname === SUBSCRIPTION_LIMITED_NICKNAME) {
      return HttpResponse.json(
        errorEnvelope(429, "RATE_LIMIT_EXCEEDED", "Too many requests"),
        { status: 429 }
      );
    }
    return HttpResponse.json<SubscriptionOk>({
      subscribed: true,
      subscribersCount: baseSubscribers(nickname) + 1,
    });
  }),

  http.delete(`${env.API_URL}/channels/:nickname/subscription`, ({ params }) =>
    HttpResponse.json<SubscriptionOk>({
      subscribed: false,
      subscribersCount: Math.max(baseSubscribers(params.nickname as string) - 1, 0),
    })
  ),

  // Lida pelo Server Component da área de canais seguidos; o usuário vem do
  // access token que o mock de login emite para cada e-mail.
  http.get(`${env.API_URL}/me/subscriptions`, ({ request }) => {
    const url = new URL(request.url);
    const offset = Number(url.searchParams.get("offset") ?? 0);
    const limit = Number(url.searchParams.get("limit") ?? DEFAULT_SUBSCRIPTIONS_LIMIT);
    const email = emailFromAuthHeader(request.headers.get("authorization"));
    const channels = email === NO_SUBSCRIPTIONS_EMAIL ? [] : buildSubscribedChannels();
    return HttpResponse.json<SubscribedChannelsOk>({
      items: channels.slice(offset, offset + limit),
      total: channels.length,
      offset,
      limit,
    });
  }),
];
