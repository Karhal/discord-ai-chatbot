# Discord-GPT

Welcome to the Discord-GPT project, an advanced integration of GPT with Discord to create interactive and engaging chat experiences. This bot leverages the power of artificial intelligence to provide natural and contextual responses, making each interaction unique and personalized.

## Features

- **Brave and Google News Search**: Integrates real-time searches to provide updated information.
- **Cryptocurrency Price Tracking**: Offers live updates on cryptocurrency prices.
- **Image Generation**: Creates images based on descriptions provided by users.
- **Customization**: Allows extensive customization through `config.ts`, including language choice, API keys, and more.

## Prerequisites

Before getting started, make sure you have Node.js installed on your system. You will also need API keys for OpenAI, Brave Search, and other services used by the bot.

## Installation

1. Clone this repository to your local machine.
2. Run `npm install` to install all necessary dependencies.
3. Copy `src/config.ts.dist` to `src/config.ts` and fill it with your own values.
4. Launch the bot with `npm run start`.

## Configuration

Open `config.ts` and adjust the settings as needed. You can set your Discord bot token, API keys for the various services, and other customization options.

## Configuration for environnements prod/local

1. duplicate config.ts.dist to config.ts.local for local purpose
2. duplicate config.ts.dist to config.ts.prod for production purpose

## build dans deploy for prod

1. do to scripts folder
2. run ./build-prod.sh (execute chmod +x build-prod.sh if file is not executable)
3. copy dist/index.cjs and package.json on the same directory on you're host
4. run npm install
5. run pm2 start index.cjs -i 1 --name=yourbot --time
6. optionnaly run pm2 save for start when your host restart

### Creating a Discord Bot Token

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Click on "New Application" and give your application a name.
3. Navigate to the "Bot" section on the left sidebar and click "Add Bot".
4. Click "Yes, do it!" to confirm.
5. Under the "Token" section, click "Copy" to copy your bot token. This token will be used in your `config.ts` file.
6. On discord go to moderator view and copy bot Id to put in config

### Obtaining API Keys

- **OpenAI API Key**:

  1. Sign up at [OpenAI](https://beta.openai.com/signup/).
  2. Navigate to the API section and generate an API key.
  3. Copy the API key and paste it into your `config.ts` file.

- **Brave Search API Key**:

  1. Sign up at [Brave Search](https://search.brave.com/).
  2. Follow their instructions to obtain an API key.
  3. Copy the API key and paste it into your `config.ts` file.

- **SerpAPI Token**:

  1. Sign up at [SerpAPI](https://serpapi.com/users/sign_up).
  2. Create an account or log in if you already have one.
  3. Navigate to the dashboard.
  4. Copy the API key provided in the dashboard.
  5. Paste the API key into your `config.ts` file.
  6. Select Google domain at [SerpAPI Google domains](https://serpapi.com/google-domains)
  7. Paste the google_domain into your `config.ts` file.

- **CoinAPI Key**:
  To use the CoinAPI features, you need to obtain an API key. Follow these steps:

  1. Go to the [CoinAPI website](https://docs.coinapi.io/).
  2. Click on the "Get a free API Key" button.
  3. Sign up for an account if you don't have one, or log in if you already have an account.
  4. Follow the instructions to generate your API key.
  5. Once you have your API key, add it to your `config.ts` file.

- **Suno**:
  To use the Suno features, you need install chromium. Follow these steps:

  1. apt install chromium on debian or ubuntu. See [Chromium website](https://www.chromium.org/) for other os
  2. Connect to [Suno website](https://suno.com/)
  3. Obtain the cookieKey by follow section "Obtain the cookie of your app.suno.ai account" on [Non official suno-api repository](https://github.com/gcui-art/suno-api)

- **Google Lighthouse API Key**:

  1. Sign up at [Google console](https://console.cloud.google.com/).
  2. Follow their instructions to obtain an API key.
  3. Activate PageSpeed Insights API module (https://console.cloud.google.com/apis/api/pagespeedonline.googleapis.com)
  4. Copy the API key and paste it into your `config.ts` file.

- **Google Search**:
  To use Google Search API features, you need to create de Search engine and obtain a apikey
  1. Go to the [Programmable search engine](https://programmablesearchengine.google.com/controlpanel/create)
  2. Create your Search engine with your preferences
  3. Go to you new search engine panel [Programmable search engine panel](https://programmablesearchengine.google.com/controlpanel/all)
  4. copy ID of search engine it to parameter cs of your `config.ts` file
  5. Get an API key, go to [Programmable search engine overview](https://developers.google.com/custom-search/v1/overview)
  6. Click on "Obtain key"
  7. Paste the API key into your `config.ts` file.

## Running the Bot

1. Ensure all necessary API keys and configurations are set in `config.ts`.
2. Run `npm run start` to launch the bot.
3. Invite the bot to your Discord server using the OAuth2 URL generated in the Discord Developer Portal.

## Running Tests

To ensure everything is working correctly, you can run the provided tests.

1. Run `npm test` to execute the tests once.
2. Run `npm run test:watch` to run the tests in watch mode, which will re-run tests on file changes.

## Troubleshooting

- **Bot Not Responding**: Ensure the bot is online and the token in `config.ts` is correct.
- **API Errors**: Double-check that all API keys are correctly entered and have the necessary permissions.
- **Dependencies Issues**: Run `npm install` again to ensure all dependencies are correctly installed.
- **Discord permissions**: Be sure your bot has a correct role in Discord and can write messages and embed files.

## Contributing

We welcome contributions! Please fork the repository and submit a pull request with your changes.

#### Commit Message Structure

When contributing, please follow the Conventional Commits specification for your commit messages. The structure is as follows:

```
<type>[(scope)][!]: <description>
[body]
[footer]
```

- **Type**: The main types are `feat` (for new features) and `fix` (for bug fixes). Other types include `build`, `chore`, `docs`, etc.
- **Scope (optional)**: Describes the part of the code or documentation affected by the changes, e.g., `api`, `parser`. Multiple scopes can be separated by `,`, `/`, or `\`.
- **Exclamation mark (optional)**: Indicates an important commit. Should include a `BREAKING CHANGE` footer.
- **Description**: A brief sentence describing the changes.
- **Body (optional)**: Detailed description of the changes.
- **Footer (optional)**: Typically includes `BREAKING CHANGE` to explain significant changes affecting the application's architecture.

**Examples:**

- Short commit message:

`fix: /users api endpoint error fix`

## License

This project is licensed under the MIT License. See the `LICENSE` file for more details.

```

```

```

```

```

```
