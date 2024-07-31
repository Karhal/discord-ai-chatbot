import OpenAI from 'openai';
import config from '../config.js';

const openaiKey = config.openaiKey || process.env.OPENAI_API_KEY;

const aiClient = new OpenAI({
  apiKey: openaiKey || process.env.OPENAI_API_KEY,
});

export { aiClient };