import { Controller, Get, Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Inject(DataSource) private readonly dataSource: DataSource,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  health() {
    return { status: 'ok', message: 'Backend is running' };
  }

  @Get('health/database')
  async databaseHealth() {
    await this.dataSource.query('SELECT 1');
    return { status: 'ok', message: 'Database connection is working' };
  }
}
