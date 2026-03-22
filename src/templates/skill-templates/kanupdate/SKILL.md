---
name: kanupdate
description: Update Kanban card status linked to Claude task
---

# Kanupdate Skill

Updates a Kanban card's status to match Claude Code task status.

## Workflow

1. Claude calls TaskUpdate first
2. Claude extracts taskId and status from result
3. Claude invokes this skill with parameters

## Command

`node .kanhelper/dist/skills/kanupdate.js --task-id "{taskId}" --status "{status}"`

Or with positional arguments:

`node .kanhelper/dist/skills/kanupdate.js {taskId} {status}`

## Parameters

- `--task-id` (required): Task ID from TaskUpdate
- `--status` (required): New task status
  - Valid values: `pending`, `in_progress`, `completed`, `parkinglot`, `deleted`

## Example Usage

```bash
# After TaskUpdate updates task "7" to "in_progress"
node .kanhelper/dist/skills/kanupdate.js --task-id "7" --status "in_progress"

# Or using positional arguments:
node .kanhelper/dist/skills/kanupdate.js 7 in_progress
```

## Notes

- Statuses now match Claude Code's native task statuses (no mapping needed)
- The skill moves the card file to the appropriate status folder
- Card frontmatter is updated with new status and timestamp
