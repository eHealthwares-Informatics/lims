import 'reflect-metadata';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { seedLis } from './seed-lis';

const config = new ConfigService();
const type = config.get<'postgres' | 'sqlite'>('DB_TYPE', 'postgres');

const dataSource = new DataSource({
  type,
  host: type === 'postgres' ? config.get<string>('DB_HOST', 'localhost') : undefined,
  port: type === 'postgres' ? Number(config.get<string>('DB_PORT', '5432')) : undefined,
  username: type === 'postgres' ? config.get<string>('DB_USER', 'postgres') : undefined,
  password: type === 'postgres' ? config.get<string>('DB_PASSWORD', 'postgres') : undefined,
  database: config.get<string>('DB_NAME', type === 'sqlite' ? 'rxsoft-lis.sqlite' : 'rxsoft_lis'),
  entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
  synchronize: config.get<string>('DB_SYNCHRONIZE', 'false') === 'true',
});

async function run() {
  await dataSource.initialize();
  await seedLis(dataSource);
  await dataSource.destroy();
}

void run();
