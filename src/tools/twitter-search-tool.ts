import { TwitterApi } from 'twitter-api-v2';
import ConfigManager from '../configManager';
import AbstractTool from './absract-tool';

interface Tweet {
  text: string;
  created_at: string;
  metrics: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
  };
  author?: {
    username: string;
    name: string;
  };
}

export default class TwitterSearchTool extends AbstractTool {
  readonly toolName = 'twitter-search';
  public readonly isActivated = ConfigManager.config.twitter.active;

  private twitterClient: TwitterApi;

  constructor() {
    super();
    this.twitterClient = new TwitterApi(ConfigManager.config.twitter.bearerToken);
  }

  public readonly description =
    'Use this tool to search tweets or read a specific tweet. You can either search by keywords or provide a Twitter URL to read a particular tweet.';

  public readonly parameters = {
    type: 'object',
    properties: {
      mode: {
        type: 'string',
        enum: ['search', 'read'],
        description: 'Operation mode: "search" to search for tweets, "read" to read a specific tweet'
      },
      query: {
        type: 'string',
        description: 'For search mode: the search query. For read mode: the tweet URL or ID'
      },
      maxResults: {
        type: 'number',
        description: 'Maximum number of tweets to return (max 100, only for search mode)',
        default: 10
      }
    },
    required: ['mode', 'query']
  };

  private extractTweetId(input: string): string {
    console.log(`[TwitterSearchTool] Extracting tweet ID from input: ${input}`);

    const urlMatch = input.match(/twitter\.com\/\w+\/status\/(\d+)/);
    if (urlMatch) {
      console.log(`[TwitterSearchTool] Extracted ID from URL: ${urlMatch[1]}`);
      return urlMatch[1];
    }

    if (/^\d+$/.test(input)) {
      console.log(`[TwitterSearchTool] Input is already a numeric ID: ${input}`);
      return input;
    }

    console.error('[TwitterSearchTool] Invalid tweet format');
    throw new Error('Invalid tweet format. Please provide a valid Twitter URL or tweet ID');
  }

  private async searchTweets(query: string, maxResults: number): Promise<Tweet[]> {
    console.log(`[TwitterSearchTool] Searching tweets with query: "${query}", max results: ${maxResults}`);

    const tweets = await this.twitterClient.v2.search({
      query,
      max_results: Math.min(maxResults, 100),
      'tweet.fields': ['created_at', 'public_metrics', 'author_id'],
      expansions: ['author_id'],
      'user.fields': ['username', 'name']
    });

    console.log(`[TwitterSearchTool] Found ${tweets.data.length} tweets`);

    const formattedTweets = tweets.data.map(tweet => ({
      text: tweet.text,
      created_at: tweet.created_at,
      metrics: tweet.public_metrics,
      author: tweets.includes?.users?.find(user => user.id === tweet.author_id)
    }));

    console.log('[TwitterSearchTool] Formatted tweets sample:', 
      formattedTweets.slice(0, 2).map(t => ({
        text: t.text.substring(0, 50) + '...',
        author: t.author?.username,
        metrics: t.metrics
      }))
    );

    return formattedTweets;
  }

  private async readTweet(tweetId: string): Promise<Tweet> {
    console.log(`[TwitterSearchTool] Reading tweet with ID: ${tweetId}`);

    const tweet = await this.twitterClient.v2.singleTweet(tweetId, {
      'tweet.fields': ['created_at', 'public_metrics', 'author_id'],
      expansions: ['author_id'],
      'user.fields': ['username', 'name']
    });

    const formattedTweet = {
      text: tweet.data.text,
      created_at: tweet.data.created_at,
      metrics: tweet.data.public_metrics,
      author: tweet.includes?.users?.[0]
    };

    console.log('[TwitterSearchTool] Retrieved tweet:', {
      text: formattedTweet.text.substring(0, 50) + '...',
      author: formattedTweet.author?.username,
      metrics: formattedTweet.metrics,
      created_at: formattedTweet.created_at
    });

    return formattedTweet;
  }

  public readonly execute = async (params: string) => {
    //try {
      console.log('[TwitterSearchTool] Executing with params:', params);
      
      const queryParameters = JSON.parse(params);
      const { mode, query, maxResults = 10 } = queryParameters;

      console.log(`[TwitterSearchTool] Mode: ${mode}, Query: ${query}, MaxResults: ${maxResults}`);

      let result;
      switch (mode) {
        case 'search':
          result = await this.searchTweets(query, maxResults);
          break;
        case 'read':
          const tweetId = this.extractTweetId(query);
          result = await this.readTweet(tweetId);
          break;
        default:
          console.error(`[TwitterSearchTool] Invalid mode: ${mode}`);
          throw new Error('Invalid mode. Use "search" or "read"');
      }

      console.log('[TwitterSearchTool] Operation completed successfully');
      return result;
    /*} catch (error) {
      console.error('[TwitterSearchTool] Error during operation:', error);
      throw error;
    }*/
  };
}