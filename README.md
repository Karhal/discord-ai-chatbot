# Discord-GPT

Welcome to the Discord-GPT project, an advanced integration of GPT with Discord to create interactive and engaging chat experiences. This bot leverages the power of artificial intelligence to provide natural and contextual responses, making each interaction unique and personalized.

## Features

- **Brave and Google News Search**: Integrates real-time searches to provide updated information.
- **Cryptocurrency Price Tracking**: Offers live updates on cryptocurrency prices.
- **Image Generation**: Creates images based on descriptions provided by users.
- **Customization**: Allows extensive customization through `config.js`, including language choice, API keys, and more.

## Prerequisites

Before getting started, make sure you have Node.js installed on your system. You will also need API keys for OpenAI, Brave Search, and other services used by the bot.

## Installation

1. Clone this repository to your local machine.
2. Run `npm install` to install all necessary dependencies.
3. Copy `config.js.dist` to `config.js` and fill it with your own values.
4. Launch the bot with `npm run start`.

## Configuration

Open `config.js` and adjust the settings as needed. You can set your Discord bot token, API keys for the various services, and other customization options.

### Creating a Discord Bot Token

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Click on "New Application" and give your application a name.
3. Navigate to the "Bot" section on the left sidebar and click "Add Bot".
4. Click "Yes, do it!" to confirm.
5. Under the "Token" section, click "Copy" to copy your bot token. This token will be used in your `config.js` file.

### Obtaining API Keys

- **OpenAI API Key**: Sign up at [OpenAI](https://beta.openai.com/signup/) and generate an API key from the API section.
- **Brave Search API Key**: Sign up at [Brave Search](https://search.brave.com/) and follow their instructions to obtain an API key.
- **SerpAPI Token**: Sign up at [SerpAPI](https://serpapi.com/users/sign_up) and follow these steps:
  1. Create an account or log in if you already have one.
  2. Navigate to the dashboard.
  3. Copy the API key provided in the dashboard.
  4. Paste the API key into your `config.js` file.

## Running the Bot

1. Ensure all necessary API keys and configurations are set in `config.js`.
2. Run `npm run start` to launch the bot.
3. Invite the bot to your Discord server using the OAuth2 URL generated in the Discord Developer Portal.

## Troubleshooting

- **Bot Not Responding**: Ensure the bot is online and the token in `config.js` is correct.
- **API Errors**: Double-check that all API keys are correctly entered and have the necessary permissions.
- **Dependencies Issues**: Run `npm install` again to ensure all dependencies are correctly installed.
- **Discord permissions**: Be sure your bot has a correct role in Discord and can write messages and embed files.

## Contributing

We welcome contributions! Please fork the repository and submit a pull request with your changes.

## License

This project is licensed under the MIT License. See the `LICENSE` file for more details.