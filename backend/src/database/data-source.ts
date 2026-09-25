import { join } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';
import { appConfig } from '../config/app.config.js';

loadEnv({ path: ['.env', '../.env'] });

const config = appConfig();
const currentDir = import.meta.dirname ?? process.cwd();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.database,
  url: config.database.url,
  schema: 'public',
  synchronize: false,
  logging: config.nodeEnv === 'development',
  entities: [join(currentDir, '..', '**', '*.entity.{ts,js}')],
  migrations: [join(currentDir, 'migrations', '*.{ts,js}')],
  migrationsTableName: 'typeorm_migrations',
  migrationsRun: false,
};

export const AppDataSource = new DataSource(dataSourceOptions);
