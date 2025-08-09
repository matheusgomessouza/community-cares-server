# community-cares-server
Community Cares server
**👨‍💻 Tecnologias / Technologies**

Esse projeto foi desenvolvido com as seguintes tecnologias / This project was developed with the following technologies:
- [Node.js](https://nodejs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [ExpressJS](https://expressjs.com/)
- [Prisma ORM](https://www.prisma.io/)
- [Vitest](https://vitest.dev/)
- [Husky](https://typicode.github.io/husky/)
- [Axios](https://axios-http.com/)
- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Swagger](https://swagger.io/)

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

**✨ Funcionalidades / Features**

- API REST para gerenciar pontos de doação de alimentos (CRUD) / REST API to manage giveaway food locations (CRUD)
- Persistência de dados com Prisma / Data persistence with Prisma
- Endpoint de health-check / Health-check endpoint
- Integração com HTTP client (Axios) / HTTP client integration (Axios)
- Testes unitários com Vitest / Unit testing with Vitest
- Hooks de Git com Husky / Git hooks with Husky
- Configuração por variáveis de ambiente (.env) / Environment-based configuration (.env)
- Opcional: execução em contêiner com Docker / Optional: containerized run with Docker

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

**💻 Projeto / Project**

Community Cares is an app that helps people find free giveaway food locations to help people in need 🧡

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

**🚀 Como executar / How to run**

Pré-requisitos / Prerequisites:
- Node.js e npm instalados OU Docker e Docker Compose / Node.js and npm installed OR Docker and Docker Compose
- Arquivo .env com as variáveis necessárias (por exemplo: DATABASE_URL, PORT) / .env file with required variables (e.g., DATABASE_URL, PORT)

Exemplo de .env / .env example (ajuste conforme seu banco) / adjust to your database:
- SQLite: DATABASE_URL="file:./dev.db"
- PostgreSQL: DATABASE_URL="postgresql://user:password@localhost:5432/community_cares?schema=public"

Execução local / Local run:
- Clone o repositório / Clone the repository
- Instale as dependências com `npm i` / Install dependencies with `npm i`
- Gere o cliente do Prisma com `npx prisma generate` / Generate Prisma client with `npx prisma generate`
- Rode as migrações com `npx prisma migrate dev --name init` / Run migrations with `npx prisma migrate dev --name init`
- Inicie o servidor com `npm run start:dev` / Start the server with `npm run start:dev`

Testes / Tests:
- Execute `npx vitest` ou `npm test` / Run `npx vitest` or `npm test`

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

**🐳 Execução com Docker / Run with Docker**

- Certifique-se de ter Docker e Docker Compose instalados / Ensure Docker and Docker Compose are installed
- Configure o .env (especialmente DATABASE_URL apontando para o serviço do banco no Compose) / Configure .env (especially DATABASE_URL pointing to the DB service in Compose)
- Suba os serviços com `docker compose up -d` (se houver docker-compose.yml) / Bring services up with `docker compose up -d` (if docker-compose.yml is present)
- Alternativa sem Compose: `docker build -t community-cares-server .` e `docker run -p 3333:3333 --env-file .env community-cares-server` / Alternative without Compose: `docker build -t community-cares-server .` and `docker run -p 3333:3333 --env-file .env community-cares-server`
- Guia de configuração Docker (artigo) / Docker config guide (article): https://matheus-docs.notion.site/Leveraging-Docker-VS-Code-Dev-Containers-during-local-development-8b43483454574dceb23f0b0dba0505fc

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

**🧑🏾‍💻 Autor / Author**

Matheus Gomes de Souza  
LinkedIn: https://www.linkedin.com/in/matheus-gomes-de-souza/  
E-mail: matheusg_souza@outlook.com
