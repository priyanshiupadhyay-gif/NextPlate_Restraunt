const swaggerJsdoc = require('swagger-jsdoc');
const { port } = require('./env');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'NextPlate Open API Grid Registry',
            version: '2.1.0',
            description: 'The definitive technical reference for the NextPlate AI-Powered Food Redistribution Protocol. This API manages the entire lifecycle of surplus food, from node emission (restaurant listing) to secure pickup verification (NGO/User claim).',
            contact: {
                name: 'NextPlate Legal & Tech Ops',
                url: 'https://nextplate.app/tech',
                email: 'ops@nextplate.grid'
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        servers: [
            {
                url: `http://localhost:${port}/api`,
                description: 'Development Server',
            },
            {
                url: 'https://api.nextplate.app/api',
                description: 'Production Server',
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
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./src/routes/*.js', './src/models/*.js'], // Path to the API docs
};

const specs = swaggerJsdoc(options);

module.exports = specs;
