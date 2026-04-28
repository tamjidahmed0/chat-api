import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from 'src/redis/redis.module';


@Injectable()
export class SessionGuard implements CanActivate {
    constructor(
        @Inject(REDIS_CLIENT) private readonly redis: Redis,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();


        const token = request.headers['authorization']?.split(' ')[1];

        if (!token) {
            throw new UnauthorizedException('No token found');
        }


        const userData = await this.redis.get(`session:${token}`);

        if (!userData) {
            throw new UnauthorizedException('Invalid or expired session');
        }


        request['user'] = JSON.parse(userData);

        return true;
    }
}