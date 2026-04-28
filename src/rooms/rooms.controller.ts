import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/rooms.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { User } from 'src/db/schema';
import { SessionGuard } from 'src/auth/auth.guard';

@Controller('rooms')
export class RoomsController {
    constructor(
        private readonly roomsService: RoomsService,
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



}
