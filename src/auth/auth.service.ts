import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import { DB } from 'src/db/database.module';
import { REDIS_CLIENT } from 'src/redis/redis.module';
import Redis from 'ioredis';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';



const SESSION_TTL = 60 * 60 * 24; // 24 hours


@Injectable()
export class AuthService {
    constructor(
        @Inject(DB) private readonly db: NodePgDatabase<typeof schema>,
        @Inject(REDIS_CLIENT) private readonly redis: Redis,
    ) { }


    async login(username: string) {
        try {

            let [user] = await this.db
                .select()
                .from(schema.users)
                .where(eq(schema.users.username, username));

            if (!user) {
                const id = `usr_${nanoid(6)}`;
                [user] = await this.db
                    .insert(schema.users)
                    .values({ id, username })
                    .returning();
            }

            const userSessionKey = `user_session:${user.id}`;

            const oldToken = await this.redis.get(userSessionKey);

            if (oldToken) {
                await this.redis.del(`session:${oldToken}`);
            }

            const sessionToken = nanoid(32);

            await this.redis.set(
                `session:${sessionToken}`,
                JSON.stringify(user),
                'EX',
                SESSION_TTL,
            );

            await this.redis.set(
                userSessionKey,
                sessionToken,
                'EX',
                SESSION_TTL,
            );

            return {
                success: true,
                data: {
                    sessionToken,
                    user,
                },
            };
        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException('Login failed');
        }
    }





}
