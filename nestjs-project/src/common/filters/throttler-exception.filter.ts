import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Response } from 'express';

/**
 * A `ThrottlerException` do `@nestjs/throttler` não é uma `DomainException`,
 * então cai no filtro padrão do Nest e a resposta sairia sem o campo `error`
 * que todo o resto da API carrega (envelope de `phase-02-auth/TD-07`). Este
 * filtro existe só para fechar essa lacuna: o 429 passa a ter a mesma forma
 * dos demais erros, e o BFF não precisa de um caminho especial para ele.
 */
@Catch(ThrottlerException)
export class ThrottlerExceptionFilter implements ExceptionFilter {
  catch(_exception: ThrottlerException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    response.status(HttpStatus.TOO_MANY_REQUESTS).json({
      statusCode: HttpStatus.TOO_MANY_REQUESTS,
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests',
    });
  }
}
