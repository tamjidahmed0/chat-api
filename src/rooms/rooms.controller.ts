import { Body, Controller, Delete, Get, Inject, Param, Post, Query, UseGuards } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto, GetMessagesQueryDto } from './dto/rooms.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { User } from 'src/db/schema';
import { SessionGuard } from 'src/auth/auth.guard';




@Controller('rooms')
export class RoomsController {
    constructor(
        private readonly roomsService: RoomsService
    ) { }


    @Post()
    @UseGuards(SessionGuard)
    async createRoom(@Body() dto: CreateRoomDto, @CurrentUser() user: User) {
        return this.roomsService.createRoom(dto.name, user.username);
    }


    @Get(':id')
    async getRoom(@Param('id') id: string) {
        return this.roomsService.getRoom(id);
    }


    @Delete(':id')
    @UseGuards(SessionGuard)
    async deleteRoom(@Param('id') id: string, @CurrentUser() user: User) {
        await this.roomsService.deleteRoom(id, user.username);

        return {
            success: true,
            data: {
                deleted: true
            }
        };
    }


    @Get(':id/messages')
    async getMessages(@Param('id') id: string, @Query() query: GetMessagesQueryDto) {
        return this.roomsService.getMessages(id, query.limit ?? 50, query.before);
    }



}
