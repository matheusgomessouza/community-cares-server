import { Injectable } from '@nestjs/common';
import { UserGitHubAuthenticate } from './users.interface';
import { GitHubService } from './libs/github/github.service';

@Injectable()
export class UsersService {
  constructor(private readonly gitHubService: GitHubService) {}

  createAccessToken() {
    return 'This action adds a new user';
  }

  createRefreshToken() {
    return 'This action adds a new user';
  }

  verifyRefreshToken() {
    return 'This action adds a new user';
  }

  setRefreshCookie() {
    return 'This action adds a new user';
  }

  clearRefreshCookie() {
    return 'This action adds a new user';
  }

  async authenticateWithGitHub(userGitHubAuthenticate: UserGitHubAuthenticate) {
    if (!userGitHubAuthenticate.code) {
      return {
        status: 400,
        message: 'Code is required',
      };
    }
    try {
      const response = await this.gitHubService.exchangeCode({
        code: userGitHubAuthenticate.code,
        code_verifier: userGitHubAuthenticate.code_verifier,
        env: userGitHubAuthenticate.env,
      });

      if (!response) {
        console.error('exchangeCodeGithub returned null/undefined');
        return {
          message: 'Failed to exchange code with GitHub',
        };
      }

      const providerAccessToken = response.access_token;

      if (!providerAccessToken) {
        console.error('No access_token returned by exchangeCodeGithub', {
          response,
        });

        return {
          status: 500,
          message: 'Failed to retrieve GitHub access token',
        };
      }

      // let profile;

      // try {
      //   profile = await this.fetchGithubProfile(providerAccessToken);
      // } catch (err) {
      //   console.error('Error fetching GitHub profile:', err);
      //   return res
      //     .status(500)
      //     .json({ message: 'Failed to fetch GitHub profile' });
      // }
      //   const userPayload = {
      //     sub: `github:${profile.providerId}`,
      //     provider: 'github',
      //     providerId: profile.providerId,
      //     name: profile.name,
      //     avatar_url: profile.avatar_url,
      //     email: profile.email,
      //   };
      //   const accessToken = await createAccessToken(userPayload);
      //   const refreshToken = await createRefreshToken(userPayload);
      //   const repo = new RefreshTokensRepository();
      //   const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
      //   await repo.save(refreshToken, userPayload.sub, expiresAt);
      //   if (env === 'web') {
      //     setRefreshCookie(res, refreshToken);
      //     return res.status(200).json({ message: 'Authentication successful' });
      //   } else {
      //     return res.status(200).json({
      //       access_token: accessToken,
      //       refresh_token: refreshToken,
      //       provider: { access_token: providerAccessToken },
      //     });
    } catch (error: unknown) {
      console.error('Error exchanging code for token:', error);
      return {
        status: 500,
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }

  authenticateWithGoogle() {
    return 'This action adds a new user';
  }
}
