import 'dotenv/config';
import { join } from 'node:path';
import { DataSource } from 'typeorm';
import databaseConfig from '../config/database.config';

const dbConfig = databaseConfig();

// Caminhos relativos a este arquivo, com a extensão dele: o mesmo DataSource
// serve ao CLI com ts-node no dev (src/, .ts) e ao `migration:run:prod` na
// imagem de produção, que só tem dist/ (.js) (testes-producao/TD-06). Não usar
// `*.{ts,js}`: o build emite `.d.ts` ao lado de cada `.js` (`declaration: true`)
// e o TypeORM tentaria carregá-los como migrations.
const ext = __filename.endsWith('.ts') ? 'ts' : 'js';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: dbConfig.host,
  port: dbConfig.port,
  username: dbConfig.username,
  password: dbConfig.password,
  database: dbConfig.name,
  synchronize: false,
  migrations: [join(__dirname, 'migrations', `*.${ext}`)],
  entities: [join(__dirname, '..', '**', `*.entity.${ext}`)],
});
