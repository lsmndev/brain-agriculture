import 'dotenv/config';

import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DataSource } from 'typeorm';
import type { DataSourceOptions } from 'typeorm';
import type { SeederOptions } from 'typeorm-extension';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const dataSourceOptions: DataSourceOptions & SeederOptions = {
  type: 'postgres',

  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT ?? 5432),
  host: process.env.DB_HOST,

  entities: [__dirname + '/../**/*.entity.{js,ts}'],
  migrations: [__dirname + '/migrations/*.{js,ts}'],
  seeds: [__dirname + '/seeds/*.{js,ts}'],
  factories: [__dirname + '/factories/**/*.{js,ts}'],

  seedTracking: false,
  synchronize: false,

  logging: process.env.NODE_ENV === 'development',

  cache: true,
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;