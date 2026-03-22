#!/usr/bin/env node
/**
 * Kanhelp skill - Display all available Kanban commands and features
 */

// ANSI color codes
const colors = {
  yellow: (text: string) => `\x1b[33m${text}\x1b[0m`,
  blue: (text: string) => `\x1b[34m${text}\x1b[0m`,
  green: (text: string) => `\x1b[32m${text}\x1b[0m`,
  cyan: (text: string) => `\x1b[36m${text}\x1b[0m`,
  red: (text: string) => `\x1b[31m${text}\x1b[0m`,
  gray: (text: string) => `\x1b[90m${text}\x1b[0m`,
  bold: (text: string) => `\x1b[1m${text}\x1b[0m`,
  dim: (text: string) => `\x1b[2m${text}\x1b[0m`
};

function showHelp() {
  console.log(colors.bold(colors.cyan('\n📚 Claude Kanban Help\n')));

  // Overview
  console.log(colors.bold('Overview:'));
  console.log('  Persistent Kanban system that integrates with Claude Code\'s native task tools.');
  console.log('  Tasks are automatically synced to markdown files organized by status.\n');

  // Skills
  console.log(colors.bold(colors.yellow('Available Skills:\n')));

  console.log(colors.bold('  /kancreate "subject" description'));
  console.log('    Create Kanban card linked to Claude Code task');
  console.log(colors.dim('    Usage: /kancreate "Fix bug" This needs urgent attention'));
  console.log(colors.dim('    Creates: Task + Kanban card with auto-detected session ID\n'));

  console.log(colors.bold('  /kanupdate {taskId} {status}'));
  console.log('    Update Kanban card status and move between columns');
  console.log(colors.dim('    Usage: /kanupdate 2 in_progress'));
  console.log(colors.dim('    Result: Card moved to IN PROGRESS column\n'));

  console.log(colors.bold('  /kancard {query}'));
  console.log('    Query and display individual card details');
  console.log(colors.dim('    Usage: /kancard 3               # By task ID'));
  console.log(colors.dim('           /kancard "Update"        # By title'));
  console.log(colors.dim('           /kancard a6bfbcfd        # By session\n'));

  console.log(colors.bold('  /kanprune') + colors.red(' [--force]'));
  console.log('    ' + colors.red('⚠️  Permanently delete all cards in DELETED status'));
  console.log(colors.dim('    Usage: /kanprune                # With confirmation'));
  console.log(colors.dim('           /kanprune --force        # Skip confirmation\n'));

  console.log(colors.bold('  /kanboard'));
  console.log('    Display compact Kanban board with all tasks');
  console.log(colors.dim('    Usage: /kanboard'));
  console.log(colors.dim('    Shows: Only active columns with cards\n'));

  console.log(colors.bold('  /kanboardfull'));
  console.log('    Display full Kanban board with all columns');
  console.log(colors.dim('    Usage: /kanboardfull'));
  console.log(colors.dim('    Shows: All columns, full card details, query examples\n'));

  console.log(colors.bold('  /kanboardweb'));
  console.log('    🌐 Generate and open HTML view of Kanban board');
  console.log(colors.dim('    Usage: /kanboardweb'));
  console.log(colors.dim('    Creates: Standalone HTML file, opens in browser\n'));

  console.log(colors.bold('  /kandoctor'));
  console.log('    Run full system health check and diagnostics');
  console.log(colors.dim('    Usage: /kandoctor'));
  console.log(colors.dim('    Checks: 60 validation points, session ID detection\n'));

  console.log(colors.bold('  /kansync'));
  console.log('    Manually sync task state with Kanban board');
  console.log(colors.dim('    Usage: /kansync'));
  console.log(colors.dim('    Shows: Current/last session, sync status\n'));

  console.log(colors.bold('  /kanhelp'));
  console.log('    Display this help message');
  console.log(colors.dim('    Usage: /kanhelp\n'));

  // Workflow Integration
  console.log(colors.bold(colors.blue('Workflow Integration:\n')));

  console.log(colors.bold('  1. Create Task + Card'));
  console.log('    /kancreate → TaskCreate + Kanban card creation');
  console.log(colors.dim('    Session ID auto-detected from Claude Code'));
  console.log(colors.dim('    Card organized in: docs/tasks/{status}/{session-id}/\n'));

  console.log(colors.bold('  2. Update Status'));
  console.log('    /kanupdate → TaskUpdate + Card file movement');
  console.log(colors.dim('    Card moves between status folders automatically'));
  console.log(colors.dim('    Frontmatter updated with new status and timestamp\n'));

  console.log(colors.bold('  3. View Board'));
  console.log('    /kanboard or /kanboardfull → Display all cards');
  console.log(colors.dim('    /kanboard: Compact view (active columns only)'));
  console.log(colors.dim('    /kanboardfull: Full view (all columns + examples)\n'));

  console.log(colors.bold('  4. View Card Details'));
  console.log('    /kancard → Query individual card information');
  console.log(colors.dim('    Search by: task ID, title, or session ID'));
  console.log(colors.dim('    Shows: Full metadata, timestamps, file path\n'));

  // Status Mapping
  console.log(colors.bold(colors.green('Status Mapping (Aligned with Claude Code):\n')));
  console.log('  Task status → Kanban folder (NO TRANSLATION NEEDED)');
  console.log(colors.dim('  ├─ pending       → docs/tasks/pending/'));
  console.log(colors.dim('  ├─ in_progress   → docs/tasks/in_progress/'));
  console.log(colors.dim('  ├─ completed     → docs/tasks/completed/'));
  console.log(colors.dim('  ├─ parkinglot    → docs/tasks/parkinglot/'));
  console.log(colors.dim('  └─ deleted       → docs/tasks/deleted/\n'));

  // Directory Structure
  console.log(colors.bold(colors.cyan('Directory Structure:\n')));
  console.log(colors.dim('  docs/tasks/'));
  console.log(colors.dim('  ├── pending/            # Pending tasks'));
  console.log(colors.dim('  │   └── {session-id}/'));
  console.log(colors.dim('  │       └── {card-name}.md  (default: ITEM_{timestamp}.md)'));
  console.log(colors.dim('  ├── in_progress/        # Active work'));
  console.log(colors.dim('  ├── completed/          # Finished tasks'));
  console.log(colors.dim('  ├── parkinglot/         # Deferred/blocked'));
  console.log(colors.dim('  ├── deleted/            # Deleted tasks'));
  console.log(colors.dim('  ├── todo.md             # Index with session tracking'));
  console.log(colors.dim('  └── lessons.md          # Lessons learned\n'));

  // Card Format
  console.log(colors.bold(colors.yellow('Card Format:\n')));
  console.log(colors.dim('  Each card is a markdown file with YAML frontmatter:'));
  console.log(colors.dim('  '));
  console.log(colors.dim('  ---'));
  console.log(colors.dim('  session: a6bfbcfd-d7b4-4180-b0f3-f71379b85c87'));
  console.log(colors.dim('  status: pending'));
  console.log(colors.dim('  created: 2026-03-21T12:00:00.000Z'));
  console.log(colors.dim('  updated: 2026-03-21T12:00:00.000Z'));
  console.log(colors.dim('  taskId: "a6bfbcfd-d7b4-4180-b0f3-f71379b85c87-2"'));
  console.log(colors.dim('  subject: Fix authentication bug'));
  console.log(colors.dim('  description: Resolve login timeout issue'));
  console.log(colors.dim('  steps: []'));
  console.log(colors.dim('  ---'));
  console.log(colors.dim('  '));
  console.log(colors.dim('  # Fix authentication bug'));
  console.log(colors.dim('  '));
  console.log(colors.dim('  Resolve login timeout issue'));
  console.log(colors.dim('  '));
  console.log(colors.dim('  ## Steps'));
  console.log(colors.dim('  - [ ] TODO: Add implementation steps'));
  console.log(colors.dim('  '));
  console.log(colors.dim('  ## Notes'));
  console.log(colors.dim('  - Session: a6bfbcfd-d7b4-4180-b0f3-f71379b85c87'));
  console.log(colors.dim('  - Task ID: a6bfbcfd-d7b4-4180-b0f3-f71379b85c87-2\n'));

  // Session ID Detection
  console.log(colors.bold(colors.blue('Session ID Detection:\n')));
  console.log('  Session ID is automatically detected from:');
  console.log('  1. Environment variable (CLAUDE_SESSION_ID) - if available');
  console.log('  2. Most recent .jsonl file in ~/.claude/projects/');
  console.log('  3. Fallback to "unknown" if neither available');
  console.log('  ');
  console.log('  Example detected session:');
  console.log(colors.dim('    Full: a6bfbcfd-d7b4-4180-b0f3-f71379b85c87'));
  console.log(colors.dim('    Display: (a6bfbcfd) - first 8 characters\n'));

  // Direct Commands (for current session)
  console.log(colors.bold(colors.green('Direct Commands (current session):\n')));
  console.log(colors.dim('  If skills aren\'t loaded yet, run these:'));
  console.log(colors.dim('  '));
  console.log(colors.dim('  node .kanhelper/dist/skills/kanboard.js'));
  console.log(colors.dim('  node .kanhelper/dist/skills/kansync.js'));
  console.log(colors.dim('  node .kanhelper/dist/skills/kanhelp.js\n'));

  // CLI Commands
  console.log(colors.bold(colors.cyan('CLI Commands:\n')));
  console.log(colors.bold('  claude-kanban init'));
  console.log('    Initialize Kanban system in current project');
  console.log(colors.dim('    Usage: npx @findependence/claude-kanban init\n'));

  console.log(colors.bold('  claude-kanban check'));
  console.log('    Verify installation status');
  console.log(colors.dim('    Usage: npx @findependence/claude-kanban check\n'));

  // Example Workflow
  console.log(colors.bold(colors.cyan('📝 Example Workflow:\n')));
  console.log(colors.bold('  Scenario: Upgrade package version\n'));

  console.log(colors.yellow('  Step 1: Create Card'));
  console.log(colors.dim('    You: "Create a kanban card to upgrade the minor version"'));
  console.log(colors.dim('    Claude: Calls /kancreate "Upgrade minor version"'));
  console.log(colors.green('    Result: Card #3 created in PENDING column\n'));

  console.log(colors.yellow('  Step 2: Start Implementation'));
  console.log(colors.dim('    You: "Let\'s upgrade to version 1.2.0"'));
  console.log(colors.dim('    Claude: Starts work + calls /kanupdate 3 in_progress'));
  console.log(colors.green('    Result: Card #3 automatically moved to IN PROGRESS\n'));

  console.log(colors.yellow('  Step 3: Complete or Defer'));
  console.log(colors.dim('    After QA/testing, you say one of:'));
  console.log(colors.dim('    • "Move this to done" → Claude calls /kanupdate 3 completed'));
  console.log(colors.dim('    • "Put this in parking lot" → Claude calls /kanupdate 3 parkinglot'));
  console.log(colors.green('    Result: Card moved to appropriate column\n'));

  console.log(colors.yellow('  Step 4: View Progress'));
  console.log(colors.dim('    You: "Show me the kanban board"'));
  console.log(colors.dim('    Claude: Calls /kanboard'));
  console.log(colors.green('    Result: Visual board showing all cards by status\n'));

  // Tips
  console.log(colors.bold(colors.yellow('💡 Tips:\n')));
  console.log('  • Session ID is auto-detected from Claude Code session files');
  console.log('  • Cards organized by session for easy session-based navigation');
  console.log('  • Status names match Claude Code natively (no translation)');
  console.log('  • Use /kandoctor for comprehensive health check (47 checks)');
  console.log('  • Custom card names supported: /kancreate "subject" --card-name "my-card"');
  console.log('  • All changes tracked in git-committable markdown files\n');

  // Resources
  console.log(colors.bold(colors.blue('📖 Resources:\n')));
  console.log(colors.dim('  Documentation: .kanhelper/README.md'));
  console.log(colors.dim('  Plugin config: .claude/plugins/kanban/'));
  console.log(colors.dim('  Skills: .claude/skills/{kanboard,kancreate,kanupdate,kandoctor}/'));
  console.log(colors.dim('  Session files: ~/.claude/projects/-{project-path}/\n'));
}

// Run if executed directly
if (require.main === module) {
  showHelp();
}

export { showHelp };
