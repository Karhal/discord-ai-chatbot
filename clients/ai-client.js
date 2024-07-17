import OpenAI from 'openai';
import config from '../config.json' assert { type: 'json' };
import dotenv from 'dotenv';

const openaiKey = config.openaiKey || process.env.OPENAI_API_KEY;
dotenv.config();

const aiClient = new OpenAI({
  apiKey: openaiKey || process.env.OPENAI_API_KEY,
});

export { aiClient };