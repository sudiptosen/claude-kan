# claude-kan

> Persistent file-based Kanban system for Claude Code with 10+ skills for seamless task management

[![npm version](https://img.shields.io/npm/v/claude-kan.svg)](https://www.npmjs.com/package/claude-kan)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 📋 Purpose

**claude-kan** is a standalone, file-based Kanban system designed specifically for Claude Code users who want persistent task management across coding sessions.

### Why This Exists

When working with Claude Code, tasks and context disappear between sessions. claude-kan solves this by:

1. **Persistent Storage** - Tasks stored as markdown files in `docs/tasks/` organized by status and session
2. **Session Tracking** - Auto-detects Claude Code session IDs to organize work chronologically
3. **Zero Configuration** - Works out of the box with any project (Next.js, React, Node.js, etc.)
4. **Rich Tooling** - 10+ skills for creating, updating, viewing, and managing tasks
5. **Visual Options** - Terminal board, full board, and HTML web view
6. **Git-Friendly** - Markdown files integrate naturally with version control

### Core Features

- ✅ **10+ Skills**: `/kanboard`, `/kancreate`, `/kanupdate`, `/kancard`, `/kanprune`, `/kanboardweb`, etc.
- ✅ **File-Based**: No database required - just markdown files
- ✅ **Session-Aware**: Automatically tracks Claude Code sessions
- ✅ **Multiple Views**: Terminal (compact/full) and HTML web views
- ✅ **Cross-Project**: Install in any JavaScript/TypeScript project
- ✅ **Offline-First**: Works without internet connection
- ✅ **Git Integration**: Track task history with your code changes

---

## 🚀 Quick Start (For Users)

### Installation

```bash
# Install in your project
npx claude-kan init
```

This creates:
- `.claude/skills/` - Skill definitions for Claude Code
- `.kanhelper/` - Compiled system code
- `docs/tasks/` - Task storage with folders for each status

### Natural Language Workflow (Recommended)

Use natural prompts with Claude, and Claude can run the right kanban skill for you:

- "Create a card for implementing OAuth login" → `/kancreate "Implement OAuth login" Add OAuth flow support`
- "Move task 3 to in progress" → `/kanupdate 3 in_progress`
- "Show me the board" → `/kanboard`
- "Show all columns" → `/kanboardfull`
- "Open the web board" → `/kanboardweb`
- "Show card 3" → `/kancard 3`

### Quick Command Reference

**Creating & Managing Cards**
- `/kancreate "subject" description` - Create new task + card
- `/kanupdate {taskId} {status}` - Update card status
- `/kancard {query}` - View individual card details

**Viewing Your Board**
- `/kanboard` - Compact board view (active columns)
- `/kanboardfull` - Full board view (all columns)
- `/kanboardweb` - HTML board that opens in browser

**Maintenance**
- `/kansync` - Manually sync task state
- `/kandoctor` - Run system health check
- `/kanprune` - Delete all cards in `deleted` status

**Status Options**
- `pending` - Tasks waiting to start
- `in_progress` - Active work
- `completed` - Finished tasks
- `parkinglot` - Deferred or blocked
- `deleted` - Deleted tasks

Cards are stored as git-committable markdown files in `docs/tasks/{status}/{session-id}/`.

---

## 🖼️ Screenshot

![K_BOARD web view](docs/assets/k-board.png)

---

## ⚠️ Limitations

- `Task*` hooks in Claude Code currently do not auto-sync with cards, so some updates are manual.
- `/kanboardweb` generates static HTML and requires regeneration for fresh data.
- Session detection can fall back to `unknown` if Claude's session metadata cannot be detected.
- Designed for individual workflow; it is not a multi-user collaborative board.

---

## 📚 Documentation

- Install with `npx claude-kan init`.
- Run `/kanhelp` to see all available skills.
- Run `/kandoctor` to validate your setup.
- Task files live in `docs/tasks/` in your project.

---

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details.

---

## 🔗 Links

- **npm Package**: https://www.npmjs.com/package/claude-kan
- **GitHub Repository**: https://github.com/sudiptosen/claude-kan
- **Issue Tracker**: https://github.com/sudiptosen/claude-kan/issues
- **Claude Code**: https://claude.ai/code

---

## 💬 Support

- **Issues**: [GitHub Issues](https://github.com/sudiptosen/claude-kan/issues)
- **Discussions**: [GitHub Discussions](https://github.com/sudiptosen/claude-kan/discussions)

---

**Built with ❤️ for Claude Code users who want persistent task management**
