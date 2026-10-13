import { Controller, Get } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';

// Health simples da API (testes-producao/TD-10, Option B): o compose de
// produção usa como `healthcheck` e como condição de subida dos serviços
// dependentes. Responde "o processo subiu e atende HTTP" — não consulta banco,
// fila nem storage. Fica fora do Swagger por ser infraestrutura, não contrato
// do front: assim o `openapi.json` da cadeia de contrato não muda.
@ApiExcludeController()
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  check(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
