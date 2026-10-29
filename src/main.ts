import { ValidationPipe, type LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

// Log verbosity from LOG_LEVEL: error | warn | log/info | debug | verbose | silent.
const LOG_LEVELS: Record<string, LogLevel[]> = {
  error: ['error', 'fatal'],
  warn: ['error', 'fatal', 'warn'],
  log: ['error', 'fatal', 'warn', 'log'],
  info: ['error', 'fatal', 'warn', 'log'],
  debug: ['error', 'fatal', 'warn', 'log', 'debug'],
  verbose: ['error', 'fatal', 'warn', 'log', 'debug', 'verbose'],
  silent: [],
};

function resolveLoggerLevels(value?: string): LogLevel[] {
  return LOG_LEVELS[(value ?? 'log').toLowerCase()] ?? LOG_LEVELS.log;
}


async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: resolveLoggerLevels(process.env.LOG_LEVEL) });
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, transformOptions: {
        enableImplicitConversion: true,
      }, }));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('RxSoft LIS API')
    .setDescription('Laboratory Information System backend')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig));

  const port = app.get(ConfigService).get<number>('PORT', 8091);
  await app.listen(port);
}

void bootstrap();
