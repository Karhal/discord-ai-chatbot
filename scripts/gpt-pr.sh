#!/bin/bash

# Ensure the script exits if any command fails
set -e

# Read the PR diff content from the in the workflow
DIFF_CONTENT=$(cat pr_diff.txt)

# Define the instructions to be sent to ChatGPT
#INSTRUCTIONS="Based on the code diff below, please provide a summary of the major insights derived. Also, check for any potential issues or improvements. The response should be a concise summary without any additional formatting, markdown, or characters outside the summary text."
INSTRUCTIONS="As a highly skilled software engineer specializing in code reviews, your mission is to meticulously analyze NodeJS code pull requests to ensure that the code diff is of pristine quality and contains no logical errors. You will be reviewing code changes provided in a unidiff format. Your feedback should be constructive, professional, and presented in markdown format.\nYour goal: Identify and address any issues related to code quality, logical consistency, and adherence to best practices. Avoid suggesting the addition of comments, documentation, dependencies, or related pull requests.\nHere is your task:\nAnalyze the Code Diff: Examine the provided unidiff format code changes, focusing on code quality, logical correctness, and adherence to best practices.\nIdentify Issues: Look for any logical errors, potential bugs, and areas where the code could be optimized or improved.\nProvide Constructive Feedback: Offer clear, concise, and actionable feedback in markdown format. Ensure your feedback is professional and aimed at improving the code quality.\nExample of how to structure your feedback in markdown:\nmarkdown\n## Summary\nThe code changes involve refactoring how events are handled in the Discord client by introducing an `EventDiscord` class. This change promotes a more structured approach to event management.\n\n## Changes Reviewed\n\n1. **DiscordClient Class Enhancements**:\n   - The `DiscordClient` class now uses `EventDiscord` for loading events, transitioning from a promise-based approach to a more synchronous `await` syntax. This is a clear improvement for readability and error handling.\n\n   ```javascript\n   try {\n       const myModule = await import(filePath);\n       new myModule.default(this.client).init();\n   } catch (ex) {\n       console.log('Error on loading event ' + file, ex);\n   }\n   ```\n\n   - **Feedback**: This approach improves clarity regarding the event lifecycle and error handling. Consider using a logging library for better error tracking in a production environment.\n\n2. **Creation of EventDiscord Class**:\n   - A new class `EventDiscord` has been introduced, encapsulating event behavior and instantiation logic.\n\n   ```javascript\n   export default class EventDiscord {\n       eventName = 'eventName';\n       once = false;\n       handler() {};\n       ...\n   }\n   ```\n\n   - **Feedback**: This encapsulation nicely abstracts event registration and makes it easier to manage events. It would be beneficial to ensure that the `handler` method is properly defined in each subclass that extends `EventDiscord`.\n"

# Combine the instructions and the diff content into a single prompt
#FULL_PROMPT="$INSTRUCTIONS\n\n$DIFF_CONTENT"

# Create a JSON payload for the OpenAI API request
MESSAGES_JSON=$(jq -n --arg body "$DIFF_CONTENT" --arg system "$INSTRUCTIONS" '[{"role":"system", "content": $system}, {"role": "user", "content": $body}]')

# Call the OpenAI API to get a response based on the provided prompt
RESPONSE=$(curl -s -X POST "https://api.openai.com/v1/chat/completions" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"model\": \"gpt-4o-mini\", \"messages\": $MESSAGES_JSON, \"max_tokens\": 2000}")

# Extract the summary from the API response
SUMMARY=$(echo "$RESPONSE" | jq -r '.choices[0].message.content')

# Save the extracted summary to a file
echo "$SUMMARY" > summary.txt

# a JSON payload for the GitHub API request to post a comment
comment_body=$(jq -n --arg body "$(cat summary.txt)" '{body: $body}')

# Post the summary as a comment on the pull request using the GitHub API
curl -s -X POST \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$comment_body" \
  "https://api.github.com/repos/$REPO/issues/$PR_NUMBER/comments"
