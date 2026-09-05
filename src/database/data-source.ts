import { config } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

config();

const type = process.env.DB_TYPE || 'postgres';

export const AppDataSource = new DataSource({
  type,
  host: type === 'postgres' ? process.env.DB_HOST || 'localhost' : undefined,
  port: type === 'postgres' ? Number(process.env.DB_PORT || '5432') : undefined,
  username: type === 'postgres' ? process.env.DB_USER || 'postgres' : undefined,
  password: type === 'postgres' ? process.env.DB_PASSWORD || 'postgres' : undefined,
  database: process.env.DB_NAME || (type === 'sqlite' ? 'rxsoft-lis.sqlite' : 'lis'),
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
} as DataSourceOptions);
