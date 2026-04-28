import { ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DB } from 'src/db/database.module';
import * as schema from '../db/schema';
import { nanoid } from 'nanoid';
import { eq, desc, and, lt, SQL } from 'drizzle-orm';
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



    async getRoom(id: string) {
        const [room] = await this.db.select().from(schema.rooms).where(eq(schema.rooms.id, id));
        if (!room) {
            throw new NotFoundException({ code: 'ROOM_NOT_FOUND', message: `Room with id ${id} does not exist` });
        }
        return {
            success: true,
            data: {
                ...room, activeUsers: await this.getActiveUserCount(id)
            }
        };
    }


    async deleteRoom(id: string, requestingUsername: string): Promise<void> {
        const room = await this.getRoomRaw(id);
        if (!room) {
            throw new NotFoundException({ code: 'ROOM_NOT_FOUND', message: `Room with id ${id} does not exist` });
        }
        if (room.createdBy !== requestingUsername) {
            throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Only the room creator can delete this room' });
        }
        await this.db.delete(schema.rooms).where(eq(schema.rooms.id, id));
        // Cleanup Redis active user set
        await this.redis.del(this.activeUsersKey(id));

        // Notify all WebSocket clients via Redis pub/sub
        await this.redis.publish('chat:events', JSON.stringify({ type: 'room:deleted', roomId: id }));
    }



    async getMessages(roomId: string, limit: number, before?: string) {
        const room = await this.getRoomRaw(roomId);
        if (!room) {
            throw new NotFoundException({
                code: 'ROOM_NOT_FOUND',
                message: `Room with id ${roomId} does not exist`,
            });
        }

        const safeLimit = Math.min(limit, 100);

        let whereCondition: SQL<unknown> = eq(schema.messages.roomId, roomId)!;

        if (before) {
            const [cursor] = await this.db
                .select()
                .from(schema.messages)
                .where(eq(schema.messages.id, before));

            if (cursor) {
                whereCondition = and(
                    eq(schema.messages.roomId, roomId),
                    lt(schema.messages.createdAt, cursor.createdAt)
                ) as SQL<unknown>;
            }
        }

        const rows = await this.db
            .select()
            .from(schema.messages)
            .where(whereCondition)
            .orderBy(desc(schema.messages.createdAt))
            .limit(safeLimit + 1);

        const hasMore = rows.length > safeLimit;
        const page = rows.slice(0, safeLimit);

        return {
            success: true,
            data: {
                messages: page.reverse(),
                hasMore,
                nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null,
            },
        };
    }





    async getRoomRaw(id: string) {
        const [room] = await this.db.select().from(schema.rooms).where(eq(schema.rooms.id, id));
        return room ?? null;
    }

    async getActiveUserCount(roomId: string): Promise<number> {
        return this.redis.scard(this.activeUsersKey(roomId));
    }

    private activeUsersKey(roomId: string) {
        return `room:${roomId}:users`;
    }

}
