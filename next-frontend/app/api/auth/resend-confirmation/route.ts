import { NextResponse } from "next/server";

import type {
  ResendConfirmationDto,
  ApiErrorEnvelope,
} from "@/lib/api/contracts";
import { upstream } from "@/lib/api/upstream";

export async function POST(request: Request) {
  const body = (await request.json()) as ResendConfirmationDto;

  const { error, response } = await upstream.POST("/auth/resend-confirmation", {
    body,
  });

  if (error) {
    return NextResponse.json<ApiErrorEnvelope>(error as ApiErrorEnvelope, {
      status: response.status,
    });
  }

  // 204 pass-through — o upstream responde igual para conta inexistente ou já
  // confirmada (anti-enumeration).
  return new Response(null, { status: 204 });
}
