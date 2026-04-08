import { Module } from '@nestjs/common';
import { UsersController } from './controllers/users.controller';
import { UsersService } from './services/users.service';
import { HttpService } from '@nestjs/axios';
// import {} from "./repositories/user.repository"

@Module({
  imports: [HttpService],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
