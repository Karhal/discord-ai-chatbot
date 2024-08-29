# Discord AI Chatbot

Discord AI Chatbot is an advanced AI-powered Discord bot that leverages the capabilities of AI models like GPT or Claude to provide interactive and engaging chat experiences. This bot integrates various features and tools to enhance user interactions and provide real-time information.

## Features

- **AI-Powered Conversations**: Utilizes AI models for natural and contextual responses.
- **Image Generation**: Creates images based on user descriptions using DALL-E or Flux.
- **Web Search**: Integrates Brave Search and Google Search for up-to-date information.
- **Cryptocurrency Price Tracking**: Offers live updates on cryptocurrency prices.
- **Google Lighthouse Integration**: Analyzes webpage performance.
- **Memory Function**: Ability to remember and recall information from conversations.
- **Multi-language Support**: Configurable to respond in different languages.

## Prerequisites

- Node.js (latest LTS version recommended)
- npm (comes with Node.js)
- Discord Bot Token
- API keys for various services (OpenAI, Brave Search, Google, etc.)

## Installation

1. Clone the repository:
   ```
   git clone git@github.com:Karhal/discord-ai-chatbot.git
   cd discord-ai-chatbot
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up configuration:
   - Copy `src/config.ts.dist` to `src/config.ts`
   - Edit `src/config.ts` with your API keys and preferences

4. Start the bot:
   ```
   npm run start
   ```

## Configuration

The `src/config.ts` file contains all the configuration options. Here are some key areas:

- Discord bot token
- AI client selection (OpenAI or Claude)
- API keys for various services
- Language settings
- Feature toggles

Refer to the comments in the config file for detailed explanations of each option.

## Setting Up API Keys

### Discord Bot Token
1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application and add a bot to it
3. Copy the bot token and add it to your `config.ts`

### OpenAI API Key
1. Sign up at [OpenAI](https://beta.openai.com/signup/)
2. Navigate to the API section and generate an API key
3. Add the key to your `config.ts`

### Claude API Key
To use Claude as your AI model:

1. Go to the [Anthropic AI website](https://www.anthropic.com/).
2. Sign up for an account or log in if you already have one.
3. Navigate to the API section in your account dashboard.
4. Generate a new API key.
5. Copy the API key and add it to your `config.ts` file under the `claude.apiKey` field.

Note: Anthropic may have specific requirements or a waitlist for API access. Check their current policies and follow their instructions to obtain API access.

### Other API Keys
Follow similar processes for other services like Brave Search, Google Search, CoinAPI, etc. Refer to each service's documentation for specific instructions.

## Running in Production

To run this application in a production environment, follow these steps:

1. Install production dependencies only:
   ```
   npm install --production
   ```

2. Build the project:
   ```
   npm run build
   ```

3. Start the application:
   ```
   npm start
   ```

The `--production` flag ensures that only dependencies listed in the "dependencies" section of `package.json` are installed, excluding devDependencies. This reduces the installation size and potential security risks in the production environment.

The build process uses `tsup` to compile and minify the TypeScript code. The production build is generated in the `dist` directory, with `index.cjs` as the main entry point.

Make sure to set up any necessary environment variables before running the application in production.

## Development

- Run tests: `npm test`
- Run in watch mode: `npm run test:watch`
- Lint code: `npm run lint`

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes and commit them using Conventional Commits
4. Push to your fork and submit a pull request

### Commit Message Format

Follow the Conventional Commits specification:
<type>[optional scope]: <description>
[optional body]
[optional footer(s)]

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Example: `feat(search): add Google Search integration`

## Troubleshooting

- **Bot not responding**: Check your Discord token and bot permissions
- **API errors**: Verify API keys in `config.ts`
- **Dependency issues**: Try deleting `node_modules` and running `npm install` again

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

## Support

For support, please open an issue on the GitHub repository or join our Discord community [link to Discord].