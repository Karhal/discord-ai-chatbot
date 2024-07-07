const OpenAI = require('openai');
const { openaiKey } = require('../config.json');


require('dotenv').config();

const aiClient = new OpenAI({
    apiKey: openaiKey|| process.env.OPENAI_API_KEY,
  });

module.exports = { 
  aiClient
};

