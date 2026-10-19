import {
  Controller,
  Get,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';

@Controller('health')
export class HealthController {
  constructor(
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  @Get()
  checkHealth() {
    if (this.connection.readyState !== 1) {
      throw new ServiceUnavailableException({
        status: 'error',
        database: 'disconnected',
      });
    }

    return {
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    };
  }
}