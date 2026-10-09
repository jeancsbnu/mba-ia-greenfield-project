import { createHash, timingSafeEqual } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import {
  InjectThrottlerOptions,
  InjectThrottlerStorage,
  ThrottlerGuard,
  type ThrottlerModuleOptions,
  type ThrottlerStorage,
} from '@nestjs/throttler';
import internalApiConfig from '../../config/internal-api.config';
import { CLIENT_IP_HEADER, INTERNAL_TOKEN_HEADER } from '../auth.constants';
import type { JwtPayload } from '../auth.types';

interface TrackedRequest {
  ip?: string;
  user?: JwtPayload;
  headers: Record<string, string | string[] | undefined>;
}

// Chave do rate limit (rate-limit-visitor-identity/TD-02, TD-03): a conta
// quando há usuário autenticado, o IP do visitante caso contrário. Todo
// visitante chega ao Nest pelo socket do BFF, então o IP real só é aceito do
// `X-Client-IP` quando a requisição prova ser do BFF com o segredo
// compartilhado; sem prova, vale o `req.ip`, sem erro.
@Injectable()
export class VisitorThrottlerGuard extends ThrottlerGuard {
  private readonly secretDigest: Buffer;

  constructor(
    @InjectThrottlerOptions() options: ThrottlerModuleOptions,
    @InjectThrottlerStorage() storageService: ThrottlerStorage,
    reflector: Reflector,
    @Inject(internalApiConfig.KEY)
    config: ConfigType<typeof internalApiConfig>,
  ) {
    super(options, storageService, reflector);
    this.secretDigest = digest(config.secret);
  }

  protected getTracker(req: Record<string, any>): Promise<string> {
    const request = req as TrackedRequest;
    if (request.user?.sub) {
      return Promise.resolve(`user:${request.user.sub}`);
    }
    return Promise.resolve(`ip:${this.resolveIp(request)}`);
  }

  private resolveIp(request: TrackedRequest): string | undefined {
    const clientIp = singleValue(request.headers[CLIENT_IP_HEADER])?.trim();
    const token = singleValue(request.headers[INTERNAL_TOKEN_HEADER]);
    if (clientIp && token !== undefined && this.isTrusted(token)) {
      return clientIp;
    }
    return request.ip;
  }

  // Compara digests de tamanho fixo para que nem o conteúdo nem o tamanho do
  // segredo vazem pelo tempo de resposta.
  private isTrusted(token: string): boolean {
    return timingSafeEqual(digest(token), this.secretDigest);
  }
}

function digest(value: string): Buffer {
  return createHash('sha256').update(value).digest();
}

function singleValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? undefined : value;
}
