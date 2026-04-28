import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DB } from 'src/db/database.module';
import * as schema from '../db/schema';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';
import { REDIS_CLIENT } from 'src/redis/redis.module';
import Redis from 'ioredis';



@Injectable()
export class RoomsService {

    constructor(
        @Inject(DB) private readonly db: NodePgDatabase<typeof schema>,
        @Inject(REDIS_CLIENT) private readonly redis: Redis,
    ) { }




    async createRoom(name: string, createdBy: string) {
        const existing = await this.db
            .select()
            .from(schema.rooms)
            .where(eq(schema.rooms.name, name));

        if (existing.length > 0) {
            throw new ConflictException({ code: 'ROOM_NAME_TAKEN', message: 'A room with this name already exists' });
        }

        const id = `room_${nanoid(6)}`;
        const [room] = await this.db
            .insert(schema.rooms)
            .values({ id, name, createdBy })
            .returning();


        return {
            success: true,
            data: {
                room
            }
        };
    }




}
