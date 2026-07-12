'use strict';

require('dotenv').config();
const { validateEnv } = require('../src/config/env');

// Validate environment variables before anything else starts
validateEnv();

const app = require('../src/app');

module.exports = app;
