import { Controller, Body, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserGitHubEmailResponseDto } from './dtos/user-github-email-response.dto';
import { UserGitHubResponseDto } from './dtos/user-github-response.dto';
import { UserGitHubAuthenticateDto } from './dtos/user-github-authenticate.dto';
import { ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  async fetchGithubProfile(providerAccessToken: string) {
    if (!providerAccessToken) {
      throw new Error('No GitHub access token provided');
    }

    const headers = {
      Authorization: `Bearer ${providerAccessToken}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'community-cares-server',
    };

    const userRes = await fetch('https://api.github.com/user', {
      method: 'GET',
      headers,
    } as RequestInit);

    const userText = await userRes.text();
    let userJson: UserGitHubResponseDto | null = null;
    try {
      userJson = JSON.parse(userText) as UserGitHubResponseDto;
    } catch (err: unknown) {
      console.error('Failed to parse GitHub /user response as JSON', {
        status: userRes.status,
        statusText: userRes.statusText,
        body: userText,
        err,
      });
      throw new Error('Failed to parse GitHub user profile');
    }

    if (!userRes.ok) {
      console.error('GitHub /user returned non-OK', {
        status: userRes.status,
        statusText: userRes.statusText,
        body: userJson,
      });
      throw new Error('Failed to fetch GitHub user profile');
    }

    let email = userJson.email ?? undefined;
    if (!email) {
      const emailsRes = await fetch('https://api.github.com/user/emails', {
        method: 'GET',
        headers,
      } as RequestInit);

      const emailsText = await emailsRes.text();
      let emailsJson: UserGitHubEmailResponseDto[] | null = null;
      try {
        emailsJson = JSON.parse(emailsText) as UserGitHubEmailResponseDto[];
      } catch (err: unknown) {
        console.warn('Failed to parse GitHub /user/emails response', {
          status: emailsRes.status,
          statusText: emailsRes.statusText,
          body: emailsText,
          err,
        });
        emailsJson = null;
      }

      if (emailsRes.ok && Array.isArray(emailsJson)) {
        const primary = emailsJson.find((e) => e.primary) || emailsJson[0];
        email = primary?.email ?? undefined;
      } else {
        console.warn('Could not fetch GitHub emails or no emails available', {
          status: emailsRes.status,
          statusText: emailsRes.statusText,
          body: emailsJson,
        });
      }
    }

    return {
      providerId: String(userJson.id),
      name: userJson.name || userJson.login || '',
      avatar_url: userJson.avatar_url ?? undefined,
      email,
    };
  }

  @Post()
  @ApiResponse({ status: 200, description: 'OAuth authentication successful' })
  @ApiResponse({ status: 400, description: 'Invalid request body' })
  @ApiResponse({ status: 500, description: 'Failed to exchange code' })
  authenticateWithGitHub(
    @Body() userGitHubAuthenticateDto: UserGitHubAuthenticateDto,
  ) {
    return this.usersService.authenticateWithGitHub(userGitHubAuthenticateDto);
  }
}
