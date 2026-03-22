---
name: kanprune
description: Permanently delete all cards in deleted status
---

# Kanprune Skill

⚠️ **DESTRUCTIVE OPERATION** - Permanently deletes all cards in the DELETED status.

## Command

`node .kanhelper/dist/skills/kanprune.js [--force]`

## Usage

### Standard (with confirmation)
```bash
/kanprune
```

Shows all cards that will be deleted and asks for confirmation before proceeding.

### Force mode (skip confirmation)
```bash
/kanprune --force
```

Deletes all cards immediately without confirmation prompt. Use with caution!

## What It Does

1. **Scans** the deleted folder for all cards
2. **Lists** all cards that will be permanently deleted with details:
   - Card title
   - Session ID
   - Created date
   - File path
3. **Asks for confirmation** (unless --force flag is used)
4. **Permanently deletes** all card files
5. **Cleans up** empty session directories
6. **Reports** summary of deleted cards and any errors

## Safety Features

- ⚠️ Displays clear warning before deletion
- 📋 Lists all cards that will be deleted
- 🔒 Requires explicit "yes" confirmation
- 📊 Provides detailed deletion summary
- 🗑️ Cleans up empty directories automatically

## When to Use

Use `/kanprune` when you want to:
- Clean up old deleted cards permanently
- Free up disk space from archived cards
- Maintain a clean kanban structure
- Permanently remove cards you no longer need

## Important Notes

- **This action CANNOT be undone** - deleted cards are permanently removed
- **No backup is created** - ensure you have backups if needed
- **Empty session folders are removed** - keeps directory structure clean
- **Failed deletions are reported** - shows which cards couldn't be deleted

## Example Output

```
⚠️  DESTRUCTIVE OPERATION WARNING ⚠️
══════════════════════════════════════════════════

The following cards will be PERMANENTLY DELETED:

1. Update Version 1.1
   Session: a6bfbcfd...
   Created: 3/21/2026
   Path: docs/tasks/deleted/a6bfbcfd.../version-update.md

Total: 1 card will be permanently deleted
This action CANNOT be undone!

Type "yes" to confirm deletion (or anything else to cancel): yes

🗑️  Deleting cards...

✅ Deleted: Update Version 1.1
   Removed empty session directory

══════════════════════════════════════════════════

📊 Pruning Summary:

✅ Successfully deleted: 1 card
```

## Recovery

**IMPORTANT**: Once pruned, cards cannot be recovered through the kanban system. If you need to keep records:

1. **Before pruning**: Use `/kancard` to review cards
2. **Backup option**: Manually copy `docs/tasks/deleted/` before pruning
3. **Git history**: If tracked by git, cards may be recoverable from history
