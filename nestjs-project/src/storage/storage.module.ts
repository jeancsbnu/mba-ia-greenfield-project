import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import storageConfig from '../config/storage.config';
import { StorageService } from './storage.service';

@Module({
  // O StorageService injeta o storageConfig: declarado aqui, o módulo compila
  // também fora do AppModule (testes de módulo, worker).
  imports: [ConfigModule.forFeature(storageConfig)],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
