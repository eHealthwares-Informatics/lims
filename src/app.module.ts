import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmModuleOptions } from '@nestjs/typeorm/dist/interfaces/typeorm-options.interface';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { DatabaseSeedService } from './database/seeding.service';
import { HealthController } from './modules/health/controllers/health.controller';
import { LisModule } from './modules/lis/lis.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.register({}),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService): TypeOrmModuleOptions => {
        const type = config.get<'postgres' | 'sqlite'>('DB_TYPE', 'postgres');
        return {
          type,
          host: type === 'postgres' ? config.get<string>('DB_HOST', 'localhost') : undefined,
          port: type === 'postgres' ? Number(config.get<string>('DB_PORT', '5432')) : undefined,
          username: type === 'postgres' ? config.get<string>('DB_USER', 'postgres') : undefined,
          password: type === 'postgres' ? config.get<string>('DB_PASSWORD', 'postgres') : undefined,
          database: config.get<string>('DB_NAME', type === 'sqlite' ? 'rxsoft-lis.sqlite' : 'lis'),
          autoLoadEntities: true,
          synchronize: config.get<string>('DB_SYNCHRONIZE', 'false') === 'true',
          dropSchema: config.get<string>('DB_DROP_SCHEMA', 'false') === 'true',
          logging: config.get<string>('TYPEORM_LOGGING', 'false') === 'true',
        } as TypeOrmModuleOptions;
      },
    }),
    LisModule,
  ],
  controllers: [HealthController],
  providers: [
    DatabaseSeedService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
