import { registerAs } from '@nestjs/config';

export interface IRedisConnectionConfig {
  host: string;
  port: number;
  password?: string;
}

export const redisConfig = registerAs('redis', (): IRedisConnectionConfig => ({
  host: process.env.REDIS_HOST as string,
  port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
}));
