import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

import { GitHubExchangeCodeBodyProps } from './github.interface';

@Injectable()
export class GitHubService {
  constructor(private readonly httpService: HttpService) {}

  exchangeCode({ code, code_verifier, env }: GitHubExchangeCodeBodyProps) {
    try {
      if (process.env.GITHUB_API_URL) {
        this.httpService.post(process.env.GITHUB_API_URL, {
          code,
          code_verifier,
          env,
        });
      }
    } catch (error: unknown) {
      return error;
    }
  }
}
