import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './db/database.module';
import { RedisModule } from './redis/redis.module';
import { ConfigModule } from '@nestjs/config';
import { RoomsModule } from './rooms/rooms.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule, DatabaseModule, RedisModule, RoomsModule]
})
export class AppModule { }
