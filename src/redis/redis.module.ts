import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';
export const REDIS_SUB_CLIENT = 'REDIS_SUB_CLIENT';
export const REDIS_EVENT_SUB = 'REDIS_EVENT_SUB';


@Global()
@Module({
    providers: [
        {
            provide: REDIS_CLIENT,
            inject: [ConfigService],
            useFactory: (config: ConfigService) => new Redis(config.get<string>('REDIS_URL')!),
        },
        {
            provide: REDIS_SUB_CLIENT,
            inject: [ConfigService],
            useFactory: (config: ConfigService) => new Redis(config.get<string>('REDIS_URL')!),
        },

        {
            provide: REDIS_EVENT_SUB,
            inject: [ConfigService],
            useFactory: (config: ConfigService) => new Redis(config.get<string>('REDIS_URL')!),
        },
    ],
    exports: [REDIS_CLIENT, REDIS_SUB_CLIENT, REDIS_EVENT_SUB],
})
export class RedisModule { }
