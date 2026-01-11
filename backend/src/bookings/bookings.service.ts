import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createBookingDto: CreateBookingDto) {
    const startTime = new Date(createBookingDto.startTime);
    const endTime = new Date(createBookingDto.endTime);

    // Validar que o horário de início está em slot de 30 minutos (minutos = 0 ou 30)
    if (startTime.getMinutes() !== 0 && startTime.getMinutes() !== 30) {
      throw new BadRequestException('O horário de início deve estar em slots de 30 em 30 minutos (ex: 08:00, 08:30, 09:00)');
    }

    // Validar que o horário de fim está em slot de 30 minutos
    if (endTime.getMinutes() !== 0 && endTime.getMinutes() !== 30) {
      throw new BadRequestException('O horário de fim deve estar em slots de 30 em 30 minutos');
    }

    // Validar que o horário está entre 8h e 18h
    const startHour = startTime.getHours();
    const endHour = endTime.getHours();

    if (startHour < 8 || startHour >= 18) {
      throw new BadRequestException('O horário de início deve estar entre 8h e 18h');
    }

    if (endHour < 8 || endHour > 18) {
      throw new BadRequestException('O horário de fim deve estar entre 8h e 18h');
    }

    // Validar que a duração é válida (1h, 1h30, 2h, 2h30, 3h)
    const validDurations = [60, 90, 120, 150, 180];
    if (!validDurations.includes(createBookingDto.expectedDuration)) {
      throw new BadRequestException('A duração deve ser de 1h, 1h30, 2h, 2h30 ou 3h');
    }

    // Validar que a diferença entre início e fim corresponde à duração esperada
    const actualDurationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    if (actualDurationMinutes !== createBookingDto.expectedDuration) {
      throw new BadRequestException('A diferença entre início e fim deve corresponder à duração selecionada');
    }

    // Validar que não está no passado
    if (startTime < new Date()) {
      throw new BadRequestException('Não é possível agendar no passado');
    }

    // Verificar se o usuário já tem uma reserva ativa (que ainda não terminou)
    const now = new Date();
    const existingBooking = await this.prisma.booking.findFirst({
      where: {
        userId,
        status: { in: ['PENDING', 'APPROVED'] },
        endTime: { gt: now }, // Apenas reservas que ainda não terminaram
      },
    });

    if (existingBooking) {
      throw new ConflictException('Você já possui uma reserva ativa. Cancele a reserva atual antes de fazer uma nova.');
    }

    // Verificar se a sala existe
    const room = await this.prisma.room.findUnique({
      where: { id: createBookingDto.roomId },
    });

    if (!room || !room.active) {
      throw new NotFoundException('Sala não encontrada ou inativa');
    }

    // Verificar se a sala está disponível no horário
    // Uma reserva conflita se:
    // 1. A reserva existente começa antes do fim da nova reserva E termina depois do início da nova reserva
    // Isso permite que uma reserva termine exatamente quando outra começa (sem conflito)
    const conflictingBooking = await this.prisma.booking.findFirst({
      where: {
        roomId: createBookingDto.roomId,
        status: 'APPROVED',
        AND: [
          { startTime: { lt: createBookingDto.endTime } }, // Reserva existente começa antes do fim da nova
          { endTime: { gt: createBookingDto.startTime } }, // Reserva existente termina depois do início da nova
        ],
      },
    });

    if (conflictingBooking) {
      throw new ConflictException('Sala já está reservada neste horário');
    }

    return this.prisma.booking.create({
      data: {
        userId,
        roomId: createBookingDto.roomId,
        startTime: createBookingDto.startTime,
        endTime: createBookingDto.endTime,
        expectedDuration: createBookingDto.expectedDuration,
      },
      include: {
        room: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findAll(userRole: string, userId?: string) {
    if (userRole === 'ADMIN') {
      return this.prisma.booking.findMany({
        include: {
          room: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // Cliente vê apenas suas reservas
    return this.prisma.booking.findMany({
      where: { userId },
      include: {
        room: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string, userRole: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        room: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Reserva não encontrada');
    }

    // Cliente só pode ver suas próprias reservas
    if (userRole === 'CLIENT' && booking.userId !== userId) {
      throw new NotFoundException('Reserva não encontrada');
    }

    return booking;
  }

  async cancel(id: string, userId: string, userRole: string) {
    const booking = await this.findOne(id, userId, userRole);

    if (booking.status === 'CANCELLED') {
      throw new BadRequestException('Reserva já está cancelada');
    }

    return this.prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        room: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async approve(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      throw new NotFoundException('Reserva não encontrada');
    }

    if (booking.status !== 'PENDING') {
      throw new BadRequestException('Reserva já foi processada');
    }

    return this.prisma.booking.update({
      where: { id },
      data: { status: 'APPROVED' },
      include: {
        room: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async getOccupiedTimeSlots(roomId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const bookings = await this.prisma.booking.findMany({
      where: {
        roomId,
        status: 'APPROVED',
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    return bookings;
  }
}
