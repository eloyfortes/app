import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { RegisterDto, LoginDto } from './dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.create(registerDto);
    return {
      message: 'Usuário cadastrado com sucesso. Aguardando aprovação do administrador.',
      userId: user.id,
    };
  }

  async login(loginDto: LoginDto) {
    this.logger.log(`📧 Buscando usuário com email: ${loginDto.email}`);
    const user = await this.usersService.findByEmail(loginDto.email);
    
    if (!user) {
      this.logger.warn(`❌ Usuário não encontrado para o email: ${loginDto.email}`);
      throw new UnauthorizedException('Credenciais inválidas');
    }

    this.logger.log(`✅ Usuário encontrado: ${user.email} (ID: ${user.id})`);
    this.logger.log(`🔐 Status de aprovação: ${user.approved}`);
    this.logger.log(`👤 Role do usuário: ${user.role}`);
    this.logger.log(`🔐 Hash da senha no BD (primeiros 20 chars): ${user.password?.substring(0, 20)}...`);

    if (!user.approved) {
      this.logger.warn(`⚠️ Usuário não aprovado: ${user.email}`);
      throw new UnauthorizedException('Usuário aguardando aprovação do administrador');
    }

    this.logger.log(`🔒 Comparando senha...`);
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    
    this.logger.log(`🔒 Resultado da comparação de senha: ${isPasswordValid}`);
    
    if (!isPasswordValid) {
      this.logger.warn(`❌ Senha inválida para o usuário: ${user.email}`);
      throw new UnauthorizedException('Credenciais inválidas');
    }

    this.logger.log(`✅ Login bem-sucedido para: ${user.email}`);
    const payload = { sub: user.id, email: user.email, role: user.role };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }
}
