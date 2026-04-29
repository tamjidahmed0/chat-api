import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { AuthModule } from 'src/auth/auth.module';
import { RoomsModule } from 'src/rooms/rooms.module';

@Module({
    imports:[AuthModule, RoomsModule],
    providers:[ChatGateway]
})
export class GatewayModule {}
