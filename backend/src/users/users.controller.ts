import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  findAll() {
    return this.usersService.findAll();
  }

  @Patch(':id/approve')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  approveUser(@Param('id') id: string) {
    return this.usersService.approveUser(id);
  }

  @Patch(':id/promote-premium')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  promoteToPremium(@Param('id') id: string) {
    return this.usersService.promoteToPremium(id);
  }
}
