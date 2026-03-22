---
name: kanboard
description: Display text-based Kanban board in console
---

# Kanboard Skill

Displays all tasks organized by status in a text-based Kanban board.

When invoked, this skill executes:
`node .kanhelper/dist/skills/kanboard.js`

## Usage

Simply type `/kanboard` in Claude Code to view your current Kanban board.

## Board Structure

- **TODO**: Pending tasks
- **IN PROGRESS**: Active work
- **DONE**: Completed tasks
- **PARKING LOT**: Deferred/blocked tasks

Each card shows:
- Task title
- Session ID (first 8 characters)
