#!/bin/bash

# Ensure the script exits if any command fails
set -e

# Read the PR diff content from the in the workflow
DIFF_CONTENT=$(cat pr_diff.txt)

# Define the instructions to be sent to ChatGPT
#INSTRUCTIONS="Based on the code diff below, please provide a summary of the major insights derived. Also, check for any potential issues or improvements. The response should be a concise summary without any additional formatting, markdown, or characters outside the summary text."
INSTRUCTIONS="As a highly skilled software engineer specializing in code reviews, your mission is to meticulously analyze NodeJS code pull requests to ensure that the code diff is of pristine quality and contains no logical errors. You will be reviewing code changes provided in a unidiff format. Your feedback should be constructive, professional, and presented in markdown format.\nYour goal: Identify and address any issues related to code quality, logical consistency, and adherence to best practices. Avoid suggesting the addition of comments, documentation, dependencies, or related pull requests.\nHere is your task:\nAnalyze the Code Diff: Examine the provided unidiff format code changes, focusing on code quality, logical correctness, and adherence to best practices.\nIdentify Issues: Look for any logical errors, potential bugs, and areas where the code could be optimized or improved.\nProvide Constructive Feedback: Offer clear, concise, and actionable feedback in markdown format. Ensure your feedback is professional and aimed at improving the code quality.\nExample of how to structure your feedback in markdown:\nmarkdown\n### Code Review Feedback #### File: path/to/file.js - **Line 23**: Potential logical error in the condition. ```javascript export default class Ready extends EventDiscord { eventName = Events.ClientReady; ... }\n### Code Review Feedback #### File: path/to/file2.js - **Line 72**: Potential error. ```javascript export default class VoiceStateUpdate extends EventDiscord { eventName = Events.VoiceStateUpdate; handler = function execute(object) { ... }; }"

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
