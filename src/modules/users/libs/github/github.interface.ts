export interface GitHubExchangeCodeBodyProps {
  code: string;
  code_verifier?: string;
  env: string;
}
