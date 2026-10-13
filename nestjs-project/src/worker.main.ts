import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WorkerModule);
  // Com os hooks ligados, o SIGTERM do `docker compose stop` fecha o worker do
  // BullMQ pelo encerramento da aplicação: ele espera o job em andamento em vez
  // de abandoná-lo no meio do processamento (testes-producao/TD-10).
  app.enableShutdownHooks();
}
void bootstrap();
