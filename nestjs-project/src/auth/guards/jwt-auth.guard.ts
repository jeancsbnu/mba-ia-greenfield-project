import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { BEARER_PREFIX } from '../auth.constants';
import { JwtPayload } from '../auth.types';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const request = context
      .switchToHttp()
      .getRequest<{ headers: Record<string, string>; user: unknown }>();
    const authHeader = request.headers?.authorization;
    const hasBearer = Boolean(authHeader?.startsWith(BEARER_PREFIX));

    // Rota pública com token: identificamos o chamador em vez de ignorá-lo, para
    // que o handler possa distinguir dono de anônimo (TD-02). Token ausente ou
    // inválido não é erro aqui — a rota continua pública e segue anônima.
    if (isPublic) {
      if (hasBearer) {
        await this.tryAttachUser(request, authHeader);
      }
      return true;
    }

    if (!hasBearer) {
      throw new UnauthorizedException();
    }

    const attached = await this.tryAttachUser(request, authHeader);
    if (!attached) {
      throw new UnauthorizedException();
    }
    return true;
  }

  private async tryAttachUser(
    request: { user: unknown },
    authHeader: string,
  ): Promise<boolean> {
    const token = authHeader.slice(BEARER_PREFIX.length);
    try {
      request.user = await this.jwtService.verifyAsync<JwtPayload>(token);
      return true;
    } catch {
      return false;
    }
  }
}
