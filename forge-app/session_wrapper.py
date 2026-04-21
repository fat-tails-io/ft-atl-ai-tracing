#!/usr/bin/env python3
"""
AI Session Wrapper - Automated Interaction Logging

This script acts as a wrapper around your AI chat sessions to automatically
log interactions for traceability.

Usage:
    1. At the START of a session: python3 session_wrapper.py start
    2. At the END of a session: python3 session_wrapper.py end
    3. To LOG a specific interaction: python3 session_wrapper.py log "your message"
"""

import json
import sys
from datetime import datetime
from pathlib import Path

LOGDIR = Path("forge-app/.logs")
SESSION_FILE = LOGDIR / f"SESSION_{datetime.now().strftime('%Y-%m-%d')}.jsonl"

def ensure_logdir():
    """Ensure log directory exists"""
    LOGDIR.mkdir(parents=True, exist_ok=True)

def log_entry(entry_type: str, content: str, metadata: dict = None):
    """Write a log entry to the session file"""
    ensure_logdir()
    
    entry = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "type": entry_type,
        "content": content,
    }
    
    if metadata:
        entry["metadata"] = metadata
    
    with open(SESSION_FILE, "a") as f:
        f.write(json.dumps(entry) + "\n")
    
    print(f"✓ Logged {entry_type} to {SESSION_FILE}")

def start_session():
    """Mark the start of a new session"""
    log_entry(
        "session_start",
        "AI-assisted development session started",
        {"session_date": datetime.now().strftime('%Y-%m-%d')}
    )
    print("\n🚀 Session started! Remember to:")
    print("   1. Copy/paste significant user messages to log them")
    print("   2. Ask Rovo to summarize and log responses")
    print("   3. Run 'session_wrapper.py end' when done\n")

def end_session():
    """Mark the end of a session"""
    log_entry(
        "session_end",
        "AI-assisted development session ended",
        {"session_date": datetime.now().strftime('%Y-%m-%d')}
    )
    print("\n✅ Session ended! View logs with:")
    print(f"   cat {SESSION_FILE}\n")

def log_message(message: str):
    """Log a user message"""
    log_entry("user_message", message)

def show_usage():
    """Show usage instructions"""
    print(__doc__)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        show_usage()
        sys.exit(1)
    
    command = sys.argv[1].lower()
    
    if command == "start":
        start_session()
    elif command == "end":
        end_session()
    elif command == "log":
        if len(sys.argv) < 3:
            print("Error: Please provide a message to log")
            sys.exit(1)
        log_message(" ".join(sys.argv[2:]))
    else:
        show_usage()
        sys.exit(1)
