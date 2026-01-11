import { Controller, Get, Post, Body, Param, Patch, Query, UseGuards, Request } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  create(@Request() req, @Body() createBookingDto: CreateBookingDto) {
    return this.bookingsService.create(req.user.userId, createBookingDto);
  }

  @Get()
  findAll(
    @Request() req,
    @Query('date') date?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNumber = page ? parseInt(page, 10) : 1;
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    return this.bookingsService.findAll(req.user.role, req.user.userId, date, status, pageNumber, limitNumber);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.bookingsService.findOne(id, req.user.userId, req.user.role);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @Request() req) {
    return this.bookingsService.cancel(id, req.user.userId, req.user.role);
  }

  @Patch(':id/approve')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  approve(@Param('id') id: string) {
    return this.bookingsService.approve(id);
  }

  @Get('room/:roomId/occupied-slots')
  getOccupiedTimeSlots(@Param('roomId') roomId: string, @Query('date') date: string) {
    return this.bookingsService.getOccupiedTimeSlots(roomId, new Date(date));
  }

  @Get('room/:roomId/bookings')
  getRoomBookings(@Param('roomId') roomId: string, @Query('date') date?: string) {
    return this.bookingsService.getRoomBookings(roomId, date);
  }
}
