import { getQueueToken } from '@nestjs/bullmq';
import { Test } from '@nestjs/testing';
import type { Queue } from 'bullmq';
import { DataSource } from 'typeorm';
import { VideoProcessingConsumer } from './videos/video-processing.consumer';
import { WorkerModule } from './worker.module';

// O worker sobe um DataSource próprio (autoLoadEntities) só com as entidades
// dos módulos que ele importa. Uma relação para uma entidade de módulo não
// importado derruba a conexão ("Entity metadata for X#y was not found") sem
// afetar a API, que importa todos os módulos — por isso o teste dedicado.
// Só compile(): init() iniciaria o Worker do BullMQ e consumiria a fila real.
describe('WorkerModule', () => {
  it('should compile and connect with every related entity registered', async () => {
    const module = await Test.createTestingModule({
      imports: [WorkerModule],
    }).compile();

    const dataSource = module.get(DataSource);
    expect(dataSource.isInitialized).toBe(true);
    expect(module.get(VideoProcessingConsumer)).toBeDefined();

    // A fila abre a conexão com o Redis em segundo plano já no compile(). Fechar
    // o módulo antes disso faz o BullMQ emitir "Connection is closed" depois,
    // sem listener, e o erro cai no arquivo de teste que estiver rodando.
    await module.get<Queue>(getQueueToken('video-processing')).waitUntilReady();
    await module.close();
  }, 60000);
});
