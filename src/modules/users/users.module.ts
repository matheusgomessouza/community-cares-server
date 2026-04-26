import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { HttpModule } from '@nestjs/axios';
import { GitHubService } from './libs/github/github.service';

@Module({
  imports: [HttpModule],
  controllers: [UsersController],
  providers: [UsersService, GitHubService],
})
export class UsersModule {}
