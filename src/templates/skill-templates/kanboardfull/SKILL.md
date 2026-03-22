---
name: kanboardfull
description: Display full Kanban board with all columns
---

# Kanboardfull Skill

Displays the complete Kanban board structure showing ALL columns, even empty ones.

## Command

`node .kanhelper/dist/skills/kanboardfull.js`

## Usage

Type `/kanboardfull` to view the complete board with all status columns visible.

## Difference from /kanboard

- **`/kanboard`**: Compact view - only shows columns that have cards
- **`/kanboardfull`**: Full view - shows all 5 columns (PENDING, IN PROGRESS, COMPLETED, PARKING LOT, DELETED)

## When to Use

Use `/kanboardfull` when you want to:
- See the complete board structure
- Understand all available status columns
- Get a full overview even with few cards
