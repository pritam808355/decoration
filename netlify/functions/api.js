const serverless = require('serverless-http');
const app = require('../../server');

// Netlify Serverless handler for YUVI DECORATION Express App
module.exports.handler = serverless(app);
