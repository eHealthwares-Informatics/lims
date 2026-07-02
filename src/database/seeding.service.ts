import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { seedLis } from './seeds/seed-lis';

@Injectable()
export class DatabaseSeedService {
  private readonly logger = new Logger(DatabaseSeedService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async runSeedsOnStartup() {
    if (this.configService.get<string>('SEED_ON_START', 'false') !== 'true') {
      return;
    }
    await this.runSeeds();
  }

  async runSeeds() {
    this.logger.log('Starting LIS seeds...');
    await seedLis(this.dataSource);
    this.logger.log('LIS seeds completed.');
  }
}
