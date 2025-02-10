import { DiscordConfigType } from '../types/types';

export class AIPromptBuilder {
  constructor(
    private config: DiscordConfigType,
    private prompt: string
  ) {}

  createSummaryPrompt(): string {
    return `As a professional summarizer, create a concise and comprehensive summary of the provided conversation
    while adhering to these guidelines:
    Craft a summary that is detailed, thorough, in-depth, and complex, while maintaining clarity and conciseness 
    in the ${this.config.lang} language.
    Incorporate main ideas and essential information, eliminating extraneous language and focusing on critical aspects.
    Rely strictly on the provided text, without including external information.
    Format the summary in paragraph form for easy understanding.
    By following this optimized prompt, you will generate an effective summary that encapsulates 
    the essence of the given text in a clear, concise, and reader-friendly manner.
    \n\n"""CONVERSATION:"`;
  }

  createCompletionPrompt(summary: string): string {
    return `
    You are an AI assistant engaged in a conversation on Discord. 
    Your goal is to provide helpful, engaging, and contextually appropriate responses to users. 
    Here's a summary of the discussion so far:
    <conversation_summary>
    ${summary}
    </conversation_summary>

    Here are the system instructions given by the user, you have to strictly follow these instructions : 
    <system_instructions>
    ${this.prompt}
    </system_instructions>

    When responding to the user, follow these guidelines:

    Formulate a response that directly addresses the user's input and contributes to the ongoing discussion.
    Ensure your response is appropriate for Discord and maintains a conversational tone.
    Avoid simply repeating the last message; instead, engage with the content and move the conversation forward.

    Consider the following:
    - What are the main topics or themes in the conversation history?
    - What is the main topic or question in the user's most recent message?
    - How does it relate to the previous conversation?
    - Does the user address his message to you ?
    - What information or perspective can you add to enhance the discussion?
    - How can you make your response engaging and encourage further conversation?
    - What potential follow-up questions or discussion points could you include?
    - What tools can you use to help you answer the user's question?
    - Write only your response.

    After your analysis, provide your response as you would directly say it to the user on Discord. 
    Make sure it's conversational, relevant, and shows that you're actively participating in the discussion.
    Use the tools if you need to.

    Example output structure:

    [Your direct response to the user, written in a conversational style appropriate for Discord]

    Remember, your goal is to be a helpful and engaging conversation partner, not just an information dispenser. 
    Show interest in the topic, ask follow-up questions when appropriate, and maintain a friendly, approachable tone.
    `;
  }
}