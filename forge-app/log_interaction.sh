#!/bin/bash
# AI Interaction Logger
# Purpose: Log interactions with Rovo Dev for traceability and replay
# Usage: ./log_interaction.sh "message_type" "content" "metadata"

LOGDIR="forge-app/.logs"
LOGFILE="$LOGDIR/SESSION_$(date +%Y-%m-%d).jsonl"

# Ensure log directory exists
mkdir -p "$LOGDIR"

# Get current timestamp
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Message type: user_message, assistant_response, tool_call, decision_point, etc.
MESSAGE_TYPE="${1:-general}"
CONTENT="${2:-}"
METADATA="${3:-{}}"

# Create JSON log entry
LOG_ENTRY=$(cat <<EOF
{"timestamp":"$TIMESTAMP","type":"$MESSAGE_TYPE","content":$(echo "$CONTENT" | jq -Rs .),"metadata":$METADATA}
EOF
)

# Append to log file
echo "$LOG_ENTRY" >> "$LOGFILE"

echo "✓ Logged to $LOGFILE"
