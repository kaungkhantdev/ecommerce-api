import {
  Controller,
  Get,
  // Put,
  // Delete,
  // Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
  // UpdateUserDto,
  UserResponseDto,
} from './dto/user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '@/common/guards/role.guard';
import { UserRole } from 'generated/prisma/enums';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getProfile(
    @CurrentUser('id') userId: string,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.getFindById(userId);
    if (!user) throw new BadRequestException('Not found user');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result;
  }

  @Get()
  @Roles(UserRole.ADMIN)
  async findAll(@Query('page') page = 1, @Query('limit') limit = 10) {
    return await this.usersService.getAll(page, limit);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.usersService.getFindById(id);
    if (!user) throw new BadRequestException('Not found user');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result;
  }

  // @Put('me')
  // async updateProfile(
  //   @CurrentUser('id') userId: string,
  //   @Body() updateUserDto: UpdateUserDto,
  // ): Promise<UserResponseDto> {
  //   const user = await this.usersService.update(userId, updateUserDto);
  //   const { password, ...result } = user;
  //   return result;
  // }

  // @Put(':id')
  // @Roles(UserRole.ADMIN)
  // async update(
  //   @Param('id') id: string,
  //   @Body() updateUserDto: UpdateUserDto,
  // ): Promise<UserResponseDto> {
  //   const user = await this.usersService.update(id, updateUserDto);
  //   const { password, ...result } = user;
  //   return result;
  // }

  // @Delete(':id')
  // @Roles(UserRole.ADMIN)
  // async delete(@Param('id') id: string): Promise<{ message: string }> {
  //   await this.usersService.delete(id);
  //   return { message: 'User deleted successfully' };
  // }
}
