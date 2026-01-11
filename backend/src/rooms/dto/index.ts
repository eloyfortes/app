import { IsString, IsInt, IsOptional, Min } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  name: string;

  @IsString()
  size: string;

  @IsInt()
  @Min(0)
  tvs: number;

  @IsInt()
  @Min(0)
  projectors: number;

  @IsInt()
  @Min(1)
  capacity: number;
}

export class UpdateRoomDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  size?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  tvs?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  projectors?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  active?: boolean;
}
