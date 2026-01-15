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

    // Verificar se o usuário já tem uma reserva ativa no mesmo dia (que ainda não terminou)
    const now = new Date();
    const startTimeDate = new Date(createBookingDto.startTime);
    
    // Obter início e fim do dia da nova reserva
    const dayStart = new Date(startTimeDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(startTimeDate);
    dayEnd.setHours(23, 59, 59, 999);

    // Verificar se existe uma reserva ativa que está ativa no mesmo dia
    // Uma reserva está ativa no dia se:
    // - Começa no mesmo dia E ainda não terminou, OU
    // - Começa antes do dia mas termina no mesmo dia ou depois (ainda está ativa)
    const existingBooking = await this.prisma.booking.findFirst({
      where: {
        userId,
        status: { in: ['PENDING', 'APPROVED'] },
        endTime: { gt: now }, // Apenas reservas que ainda não terminaram
        OR: [
          {
            // Reserva começa no mesmo dia
            startTime: {
              gte: dayStart,
              lte: dayEnd,
            },
          },
          {
            // Reserva começa antes mas ainda está ativa no mesmo dia
            AND: [
              { startTime: { lt: dayStart } },
              { endTime: { gt: dayStart } },
            ],
          },
        ],
      },
    });

    if (existingBooking) {
      throw new ConflictException('Você já possui uma reserva ativa neste dia. Cancele a reserva atual ou escolha outro dia.');
    }

    // Verificar se a sala existe
    const room = await this.prisma.room.findUnique({
      where: { id: createBookingDto.roomId },
    });

    if (!room || !room.active) {
      throw new NotFoundException('Sala não encontrada ou inativa');
    }

    // Buscar usuário para verificar o role
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    // Se for CLIENT_PREMIUM, aprova automaticamente. Se CLIENT, fica PENDING.
    const bookingStatus = user?.role === 'CLIENT_PREMIUM' ? 'APPROVED' : 'PENDING';

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
        status: bookingStatus,
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

  async findAll(
    userRole: string,
    userId?: string,
    date?: string,
    status?: string,
    page: number = 1,
    limit: number = 10,
    showCompleted: boolean = true
  ) {
    const skip = (page - 1) * limit;

    const now = new Date();
    
    // Construir filtro de data se fornecido
    const dateFilter: any = {};
    if (date) {
      // Parse a string "YYYY-MM-DD" como data local (não UTC)
      const [year, month, day] = date.split('-').map(Number);
      const selectedDate = new Date(year, month - 1, day, 0, 0, 0, 0);
      const nextDay = new Date(year, month - 1, day + 1, 0, 0, 0, 0);

      dateFilter.startTime = {
        gte: selectedDate.toISOString(),
        lt: nextDay.toISOString(),
      };
    }

    // Construir filtro de status se fornecido
    const statusFilter: any = {};
    if (status && ['PENDING', 'APPROVED', 'CANCELLED'].includes(status)) {
      statusFilter.status = status;
      
      // Para reservas aprovadas, aplicar filtro de concluídos se necessário
      if (status === 'APPROVED' && !showCompleted) {
        // Se showCompleted = false, mostrar apenas reservas não concluídas (endTime >= agora)
        dateFilter.endTime = {
          gte: now.toISOString(),
        };
      }
    }

    // Combinar filtros
    const whereClause = {
      ...dateFilter,
      ...statusFilter,
    };

    if (userRole === 'ADMIN') {
      const [bookings, total] = await Promise.all([
        this.prisma.booking.findMany({
          where: whereClause,
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
          orderBy: { startTime: 'asc' },
          skip,
          take: limit,
        }),
        this.prisma.booking.count({
          where: whereClause,
        }),
      ]);

      return {
        data: bookings,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }

    // Cliente vê apenas suas reservas
    const clientWhereClause = {
      userId,
      ...whereClause,
    };

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where: clientWhereClause,
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
        orderBy: { startTime: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.booking.count({
        where: clientWhereClause,
      }),
    ]);

    return {
      data: bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
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

  async getRoomBookings(roomId: string, date?: string) {
    console.log('[BookingsService] getRoomBookings chamado - roomId:', roomId, 'date:', date);
    const dateFilter: any = {};
    if (date) {
      // Parse a string "YYYY-MM-DD" como data local (não UTC)
      const [year, month, day] = date.split('-').map(Number);
      const selectedDate = new Date(year, month - 1, day, 0, 0, 0, 0);
      const nextDay = new Date(year, month - 1, day + 1, 0, 0, 0, 0);

      dateFilter.startTime = {
        gte: selectedDate.toISOString(),
        lt: nextDay.toISOString(),
      };
      console.log('[BookingsService] Filtro de data aplicado:', {
        gte: selectedDate.toISOString(),
        lt: nextDay.toISOString(),
      });
    } else {
      // Se não há data, buscar apenas reservas futuras
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dateFilter.startTime = {
        gte: today.toISOString(),
      };
      console.log('[BookingsService] Filtro de data futura aplicado:', today.toISOString());
    }

    const whereClause = {
      roomId,
      ...dateFilter,
      status: {
        in: ['APPROVED', 'PENDING'],
      },
    };
    console.log('[BookingsService] Where clause:', JSON.stringify(whereClause, null, 2));

    const bookings = await this.prisma.booking.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    console.log('[BookingsService] Bookings encontrados:', bookings.length);
    console.log('[BookingsService] Bookings:', JSON.stringify(bookings, null, 2));

    return bookings;
  }
}
