import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { User } from 'generated/prisma/client';
import { USER_REPOSITORY } from './users.constants';
import { IUserRepository } from './repositories/users.repository.interface';
import { UpdateUserDto } from './dto/user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async getUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async getFindById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async getUserByUsername(email: string): Promise<User | null> {
    return this.userRepository.findByUsername(email);
  }

  async getActiveUsers(page = 1, limit = 10): Promise<User[]> {
    return this.userRepository.findActive({
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async create(data: Partial<User>): Promise<User> {
    // Check if exists
    const existing =
      data.email && (await this.userRepository.findByEmail(data.email));
    // console.log(existing);
    if (existing) {
      throw new Error('User already exists');
    }
    return this.userRepository.create(data);
  }

  async getAll(skip: number, take: number) {
    return this.userRepository.findAll({ skip, take });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    await this.checkUserExit(id);

    const updateData: any = { ...updateUserDto };

    if (updateUserDto.password) {
      updateData.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    return this.userRepository.update(id, updateData);
  }

  async delete(id: string): Promise<User> {
    await this.checkUserExit(id);
    return this.userRepository.delete(id);
  }

  private async checkUserExit(id: string): Promise<void> {
    const user = await this.getFindById(id);
    if (!user) throw new BadRequestException('Not found user');
  }
}
