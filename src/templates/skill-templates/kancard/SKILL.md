---
name: kancard
description: Query and display individual Kanban card details
---

# Kancard Skill

Displays detailed information about a specific Kanban card.

## Command

`node .kanhelper/dist/skills/kancard.js <query>`

## Usage

Type `/kancard` followed by a query to view detailed card information:

```bash
/kancard 3                    # Query by task ID
/kancard "Update Version"     # Query by card title
/kancard a6bfbcfd            # Query by session ID
```

## Query Methods

The skill supports multiple ways to find a card:

### By Task ID (Most Specific)
```bash
/kancard 3
```
Finds the card linked to Claude Code task ID 3.

### By Title (Partial Match)
```bash
/kancard "Update"
```
Finds the first card whose title contains "Update" (case-insensitive).

### By Session ID (Partial Match)
```bash
/kancard a6bfbcfd
```
Finds cards from the session matching "a6bfbcfd" (supports short or full session IDs).

## Output

Displays comprehensive card details:
- **Title**: Card subject/title
- **Status**: Current status with icon (⏳ PENDING, ▶ IN PROGRESS, ✓ COMPLETED, etc.)
- **Task ID**: Link to Claude Code task (if present)
- **Session**: Full session ID
- **Created**: Card creation timestamp
- **Updated**: Last update timestamp
- **Description**: Card description
- **Steps**: Implementation steps (if any)
- **File Path**: Location of the card file

## Integration with /kanboardfull

When you run `/kanboardfull`, example queries are shown at the bottom demonstrating how to use `/kancard` with the cards currently displayed.

## When to Use

Use `/kancard` when you need:
- Complete details about a specific card
- File path for manual editing
- Full timestamps and metadata
- Implementation steps for a task
- To verify task-to-card linkage
