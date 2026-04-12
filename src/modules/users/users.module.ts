import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { HttpService } from '@nestjs/axios';
// import {} from "./repositories/user.repository"

@Module({
  imports: [HttpService],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
