import { Controller, Post, Body } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    this.logger.log(`Tentativa de registro: ${registerDto.email}`);
    return this.authService.register(registerDto);
  }

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    this.logger.log(`🔐 Tentativa de login recebida - Email: ${loginDto.email}`);
    this.logger.log(`🔐 Senha recebida (primeiros 3 chars): ${loginDto.password?.substring(0, 3)}***`);
    return this.authService.login(loginDto).catch((error) => {
      this.logger.error(`❌ Erro no login: ${error.message}`);
      throw error;
    });
  }
}
