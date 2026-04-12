import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

import { GitHubExchangeCodeBodyProps } from './github.interface';

interface GitHubTokenResponse {
  access_token: string;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
}

@Injectable()
export class GitHubService {
  constructor(private readonly httpService: HttpService) {}

  async exchangeCode({
    code,
    code_verifier,
    env,
  }: GitHubExchangeCodeBodyProps) {
    const githubApiUrl = process.env.GITHUB_API_URL;

    if (!githubApiUrl) {
      throw new Error('GITHUB_API_URL is not set');
    }

    const response = await firstValueFrom(
      this.httpService.post<GitHubTokenResponse>(githubApiUrl, {
        code,
        code_verifier,
        env,
      }),
    );

    return response.data;
  }
}
