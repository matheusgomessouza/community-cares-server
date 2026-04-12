export class UserGitHubAuthenticateDto {
  code!: string;
  env!: string;
  code_verifier?: string;
}
