import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { RegisterDto } from '../auth/dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(registerDto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email já cadastrado');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    return this.prisma.user.create({
      data: {
        email: registerDto.email,
        password: hashedPassword,
        name: registerDto.name,
        role: 'CLIENT',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        approved: true,
      },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        approved: true,
        createdAt: true,
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async approveUser(id: string) {
    const user = await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: { approved: true },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        approved: true,
      },
    });
  }

  async promoteToPremium(id: string) {
    const user = await this.findOne(id);
    
    if (user.role === 'ADMIN') {
      throw new ConflictException('Não é possível promover um administrador');
    }
    
    if (user.role === 'CLIENT_PREMIUM') {
      throw new ConflictException('Usuário já é premium');
    }
    
    return this.prisma.user.update({
      where: { id },
      data: { role: 'CLIENT_PREMIUM' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        approved: true,
      },
    });
  }
}
