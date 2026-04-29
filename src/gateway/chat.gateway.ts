import { Inject, Logger, OnModuleInit } from "@nestjs/common";
import { ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import Redis from "ioredis";
import { Server, Socket } from "socket.io";
import { AuthService } from "src/auth/auth.service";
import { REDIS_CLIENT, REDIS_EVENT_SUB, REDIS_SUB_CLIENT } from "src/redis/redis.module";
import { RoomsService } from "src/rooms/rooms.service";


interface AuthSocket extends Socket {
    data: {
        username: string;
        roomId: string;
    };
}


@WebSocketGateway({ namespace: '/chat', cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {

    constructor(
        @Inject(REDIS_CLIENT) private readonly pub: Redis,
        @Inject(REDIS_SUB_CLIENT) private readonly sub: Redis,
        @Inject(REDIS_EVENT_SUB) private readonly eventSub: Redis,
        private readonly authService: AuthService,
        private readonly roomsService: RoomsService,
    ) { }



    @WebSocketServer() server!: Server;
    private readonly logger = new Logger(ChatGateway.name);



    async onModuleInit() {
        await this.eventSub.subscribe('chat:events');
        this.eventSub.on('message', (_channel: string, raw: string) => {
            console.log('📨 Redis event received:', raw);
            this.handleRedisEvent(raw);
        });
    }

    private handleRedisEvent(raw: string) {
        try {
            const event = JSON.parse(raw);
            if (event.type === 'message:new') {
                this.server.to(event.roomId).emit('message:new', event.payload);
            } else if (event.type === 'room:deleted') {
                this.server.to(event.roomId).emit('room:deleted', { roomId: event.roomId });
            }
        } catch (e) {
            this.logger.error('Failed to parse Redis event', e);
        }
    }



    async handleConnection(client: AuthSocket) {
        try {
            const token = client.handshake.query.token as string;
            const roomId = client.handshake.query.roomId as string;

            if (!token) {
                client.emit('error', { code: 401, message: 'Missing session token' });
                client.disconnect();
                return;
            }

            const user = await this.authService.validateSession(token);
            if (!user) {
                client.emit('error', { code: 401, message: 'Missing or expired session token' });
                client.disconnect();
                return;
            }

            const room = await this.roomsService.getRoomRaw(roomId);
            if (!room) {
                client.emit('error', { code: 404, message: 'Room not found' });
                client.disconnect();
                return;
            }

            client.data.username = user.username;
            client.data.roomId = roomId;

            // Track in Redis (use socket ID as field for multi tab support)
            await this.roomsService.addActiveUser(roomId, user.username);
            // Track socket→room mapping for cleanup
            await this.pub.setex(`socket:${client.id}`, 86400, JSON.stringify({ username: user.username, roomId }));

            await client.join(roomId);

            const activeUsers = await this.roomsService.getActiveUsers(roomId);

            // Emit to connecting client only
            client.emit('room:joined', { activeUsers });

            // Broadcast to all others in the room
            client.to(roomId).emit('room:user_joined', { username: user.username, activeUsers });

            this.logger.log(`${user.username} joined room ${roomId}`);
        } catch (err) {
            this.logger.error('Connection error', err);
            client.disconnect();
        }
    }


    async handleDisconnect(client: AuthSocket) {
        await this.cleanupClient(client);
    }



    @SubscribeMessage('room:leave')
    async handleLeave(@ConnectedSocket() client: AuthSocket) {
        await this.cleanupClient(client);
        client.disconnect();
    }



    private async cleanupClient(client: AuthSocket) {
        try {
            const raw = await this.pub.get(`socket:${client.id}`);
            if (!raw) return;

            const { username, roomId } = JSON.parse(raw);
            await this.pub.del(`socket:${client.id}`);
            await this.roomsService.removeActiveUser(roomId, username);

            const activeUsers = await this.roomsService.getActiveUsers(roomId);
            client.to(roomId).emit('room:user_left', { username, activeUsers });
            this.logger.log(`${username} left room ${roomId}`);
        } catch (err) {
            this.logger.error('Disconnect cleanup error', err);
        }
    }

}