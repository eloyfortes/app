import { IsString, IsDateString, IsInt, Min } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  roomId: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsInt()
  @Min(1)
  expectedDuration: number; // em minutos
}
