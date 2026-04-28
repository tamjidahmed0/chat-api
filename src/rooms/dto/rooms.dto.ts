import { Type } from 'class-transformer';
import { IsString, Matches, MinLength, MaxLength, IsOptional, IsInt, Min, Max } from 'class-validator';

export class CreateRoomDto {
    @IsString()
    @MinLength(3, { message: 'name must be between 3 and 32 characters' })
    @MaxLength(32, { message: 'name must be between 3 and 32 characters' })
    @Matches(/^[a-zA-Z0-9-]+$/, { message: 'name may only contain alphanumeric characters and hyphens' })
    name!: string;
}


export class GetMessagesQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 50;

    @IsOptional()
    @IsString()
    before?: string;
}