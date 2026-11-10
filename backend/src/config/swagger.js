const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DevPulse API',
      version: '1.0.0',
      description: 'Developer Intelligence Platform API — analytics, wellness scoring, and team insights',
      contact: {
        name: 'DevPulse',
        url: 'https://github.com/TECHMINEs/devpulse',
      },
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production'
          ? 'https://devpulse-api.onrender.com'
          : 'http://localhost:5001',
        description: process.env.NODE_ENV === 'production' ? 'Production' : 'Development',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);
