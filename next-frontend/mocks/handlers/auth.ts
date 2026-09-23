import { http, HttpResponse } from "msw";

import type {
  RegisterResponse,
  LoginTokenPair,
  RefreshTokenPair,
  ApiErrorEnvelope,
} from "@/lib/api/contracts";
import { env } from "@/lib/env";

// Reserved trigger table (shared with E2E — trigger values must not collide across test suites).
const CONFLICT_EMAIL = "conflict@example.com";
const BAD_REQUEST_EMAIL = "badrequest@example.com";
const INVALID_CREDENTIALS_EMAIL = "invalid@example.com";
const UNCONFIRMED_EMAIL = "unconfirmed@example.com";

/**
 * Prefixo do token de acesso fabricado no login.
 *
 * As rotas `/me/*` do upstream simulado precisam saber QUEM está chamando para
 * honrar os gatilhos por e-mail dos specs (canal cheio, canal vazio, painel com
 * erro). O único canal de informação que chega até elas é o header
 * Authorization, então o e-mail viaja dentro do próprio token.
 */
export const ACCESS_TOKEN_PREFIX = "fixture-access-token:";

/** Extrai o e-mail de um header `Authorization: Bearer <token>`. */
export function emailFromAuthHeader(header: string | null): string {
  if (!header) return "";
  const token = header.replace(/^Bearer\s+/i, "");
  return token.startsWith(ACCESS_TOKEN_PREFIX)
    ? token.slice(ACCESS_TOKEN_PREFIX.length)
    : "";
}

function errorEnvelope(
  statusCode: number,
  error: string,
  message: string
): ApiErrorEnvelope {
  return { statusCode, error, message, code: null };
}

export const handlers = [
  // POST /auth/register
  http.post(`${env.API_URL}/auth/register`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const email = typeof body.email === "string" ? body.email : "";

    if (email === CONFLICT_EMAIL) {
      return HttpResponse.json(
        errorEnvelope(409, "EMAIL_ALREADY_REGISTERED", "Email already registered"),
        { status: 409 }
      );
    }
    if (email === BAD_REQUEST_EMAIL) {
      return HttpResponse.json(
        errorEnvelope(400, "VALIDATION_FAILED", "Validation failed"),
        { status: 400 }
      );
    }
    return HttpResponse.json<RegisterResponse>(
      { id: "user-fixture-id", email },
      { status: 201 }
    );
  }),

  // POST /auth/login
  http.post(`${env.API_URL}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const email = typeof body.email === "string" ? body.email : "";

    if (email === BAD_REQUEST_EMAIL) {
      return HttpResponse.json(
        errorEnvelope(400, "VALIDATION_FAILED", "Validation failed"),
        { status: 400 }
      );
    }
    if (email === INVALID_CREDENTIALS_EMAIL) {
      return HttpResponse.json(
        errorEnvelope(401, "INVALID_CREDENTIALS", "Invalid email or password"),
        { status: 401 }
      );
    }
    if (email === UNCONFIRMED_EMAIL) {
      return HttpResponse.json(
        errorEnvelope(403, "EMAIL_NOT_CONFIRMED", "Email not confirmed"),
        { status: 403 }
      );
    }
    return HttpResponse.json<LoginTokenPair>(
      {
        access_token: `${ACCESS_TOKEN_PREFIX}${email}`,
        refresh_token: `fixture-refresh-token:${email}`,
      },
      { status: 200 }
    );
  }),

  // POST /auth/logout
  http.post(`${env.API_URL}/auth/logout`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // POST /auth/forgot-password
  http.post(`${env.API_URL}/auth/forgot-password`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const email = typeof body.email === "string" ? body.email : "";

    if (email === BAD_REQUEST_EMAIL) {
      return HttpResponse.json(
        errorEnvelope(400, "VALIDATION_FAILED", "Validation failed"),
        { status: 400 }
      );
    }
    return new HttpResponse(null, { status: 204 });
  }),

  // POST /auth/refresh
  http.post(`${env.API_URL}/auth/refresh`, async ({ request }) => {
    // O e-mail atravessa o refresh: sem isso a sessão renovada perderia a
    // identidade e os gatilhos por usuário parariam de valer.
    const body = (await request.json()) as Record<string, unknown>;
    const previous =
      typeof body.refresh_token === "string" ? body.refresh_token : "";
    const email = previous.includes(":") ? previous.split(":")[1] : "";

    return HttpResponse.json<RefreshTokenPair>(
      {
        access_token: `${ACCESS_TOKEN_PREFIX}${email}`,
        refresh_token: `fixture-refresh-token:${email}`,
      },
      { status: 200 }
    );
  }),
];
