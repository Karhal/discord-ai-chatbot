#!/bin/bash

# Ensure the script exits if any command fails
set -e

# Read the PR diff content from the in the workflow
DIFF_CONTENT=$(cat pr_diff.txt)

# Define the instructions to be sent to ChatGPT
#INSTRUCTIONS="Based on the code diff below, please provide a summary of the major insights derived. Also, check for any potential issues or improvements. The response should be a concise summary without any additional formatting, markdown, or characters outside the summary text."
INSTRUCTIONS="You are a highly skilled software engineer specializing in code reviews. Your task is to review code changes in a unidiff format. Ensure your feedback is constructive and professional. Present it in markdown format, and refrain from mentioning: - Adding comments or documentation - Adding dependencies or related pull requests"

# Combine the instructions and the diff content into a single prompt
FULL_PROMPT="$INSTRUCTIONS\n\n$DIFF_CONTENT"

# Create a JSON payload for the OpenAI API request
MESSAGES_JSON=$(jq -n --arg body "$PR_BODY" --arg system "$INSTRUCTIONS" '[{"role":"system", "content": $system}, {"role": "user", "content": $body}]')

# Call the OpenAI API to get a response based on the provided prompt
RESPONSE=$(curl -s -X POST "https://api.openai.com/v1/chat/completions" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"model\": \"gpt-4o-mini\", \"messages\": $MESSAGES_JSON, \"max_tokens\": 500}")

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

# Just testing the new review
echo "Hello"