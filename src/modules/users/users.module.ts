import { Module } from '@nestjs/common';
import { UserRepository } from './repositories/users.repository';

export const USER_REPOSITORY = Symbol('IUserRepository');
@Module({
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
  ],
})
export class UsersModule {}
