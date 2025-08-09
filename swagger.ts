// swagger.ts
import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Community Cares API',
      version: '1.0.0',
      description: 'API documentation for Community Cares project',
    },
    servers: [
      {
        url: 'http://localhost:8080',
      },
    ],
  },
  apis: ['./api/*.ts'], // Adjust path to your TypeScript route files
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;