---
name: kancreate
description: Create Kanban card linked to Claude task
---

# Kancreate Skill

Creates a Kanban card linked to a Claude Code task.

## Workflow

1. Claude calls TaskCreate first
2. Claude extracts taskId from result
3. Claude invokes this skill with parameters

## Command

`node .kanhelper/dist/skills/kancreate.js --task-id "{taskId}" --subject "{subject}" --description "{description}" --status "{status}" --card-name "{cardName}"`

## Parameters

- `--task-id` (required): Task ID from TaskCreate
- `--subject` (required): Task subject/title
- `--description` (optional): Task description (default: "")
- `--status` (optional): Task status (default: "pending")
  - Valid values: `pending`, `in_progress`, `completed`, `parkinglot`, `deleted`
- `--card-name` (optional): Custom filename for the card (default: `ITEM_{epoch_time}`)

## Example Usage

```bash
# After TaskCreate returns taskId "7"
node .kanhelper/dist/skills/kancreate.js \
  --task-id "7" \
  --subject "Implement feature X" \
  --description "Add new feature to the application" \
  --status "pending" \
  --card-name "feature-x"
```

## Notes

- Statuses now match Claude Code's native task statuses (no mapping needed)
- Card names are sanitized (lowercase, hyphens for spaces, special chars removed)
- If no card name provided, uses format `ITEM_{epoch_time}.md`
