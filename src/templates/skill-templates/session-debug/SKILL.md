---
name: session-debug
description: Debug session information available to skills
---

# Session Debug Skill

Diagnostic tool to investigate what session information and environment variables are available when Claude Code invokes a skill.

## Command

`node .kanhelper/dist/skills/session-debug.js`

## Usage

Type `/session-debug` to see:
- All CLAUDE_* environment variables
- Process information
- Current working directory
- Git branch information
- Available session sources

## Purpose

This helps us understand how to properly capture the session ID when skills are invoked by Claude Code.
