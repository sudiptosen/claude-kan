#!/usr/bin/env node
/**
 * CLI tool for Claude Kanban initialization and management
 */

import fs from 'fs';
import path from 'path';
import { analyzeProject, detectConflicts } from './core/conflict';
import { ProjectAnalysis } from './core/types';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  switch (command) {
    case 'init':
      await initCommand();
      break;
    case 'check':
      await checkCommand();
      break;
    case 'help':
    default:
      showHelp();
      break;
  }
}

async function initCommand() {
  console.log('🎯 Initializing Claude Kanban System...\n');

  // 1. Analyze current project structure
  const analysis = analyzeProject();

  // 2. Detect conflicts
  const conflicts = detectConflicts(analysis);

  // 3. Generate report
  console.log('📊 Project Analysis Report:\n');
  console.log(`- Existing docs/tasks/: ${analysis.hasTasksDir ? '✅' : '❌'}`);
  console.log(`- Existing todo.md: ${analysis.hasTodoMd ? '✅' : '❌'}`);
  console.log(`- Existing lessons.md: ${analysis.hasLessonsMd ? '✅' : '❌'}`);
  console.log(`- Git repository: ${analysis.isGitRepo ? '✅' : '❌'}\n`);

  if (conflicts.length > 0) {
    console.log('⚠️  Potential Conflicts Detected:\n');
    conflicts.forEach(conflict => {
      const icon = conflict.severity === 'error' ? '❌' : '⚠️ ';
      console.log(`${icon} ${conflict.file}: ${conflict.message}`);
      console.log(`    Resolution: ${conflict.resolution}\n`);
    });

    // For now, auto-proceed (in production, use inquirer to ask)
    console.log('Proceeding with installation...\n');
  }

  // 4. Create Kanban structure
  await createKanbanStructure(analysis);

  // 5. Install plugin
  await installPlugin();

  // 6. Install skills
  await installSkills();

  console.log('\n✅ Installation complete!\n');
  console.log('Next steps:');
  console.log('  1. Run: claude (to start Claude Code)');
  console.log('  2. Use: /kanboard (to view your Kanban board)');
  console.log('  3. Use: /kansync (to manually sync tasks)\n');
}

async function checkCommand() {
  console.log('🔍 Checking Claude Kanban installation...\n');

  const analysis = analyzeProject();

  // Check Kanban structure
  const statuses = ['todo', 'inprogress', 'done', 'parkinglot'];
  console.log('Kanban Structure:');
  for (const status of statuses) {
    const exists = fs.existsSync(`docs/tasks/${status}`);
    console.log(`  - docs/tasks/${status}/: ${exists ? '✅' : '❌'}`);
  }

  // Check plugin
  console.log('\nPlugin:');
  console.log(`  - .claude/plugins/kanban/: ${fs.existsSync('.claude/plugins/kanban') ? '✅' : '❌'}`);

  // Check skills
  console.log('\nSkills:');
  console.log(`  - .claude/skills/kanboard/: ${fs.existsSync('.claude/skills/kanboard') ? '✅' : '❌'}`);
  console.log(`  - .claude/skills/kansync/: ${fs.existsSync('.claude/skills/kansync') ? '✅' : '❌'}`);
  console.log(`  - .claude/skills/kanhelp/: ${fs.existsSync('.claude/skills/kanhelp') ? '✅' : '❌'}`);
  console.log(`  - .claude/skills/kandoctor/: ${fs.existsSync('.claude/skills/kandoctor') ? '✅' : '❌'}`);

  console.log('\n');
}

function showHelp() {
  console.log(`
Claude Kanban - Persistent task management for Claude Code

Usage:
  claude-kanban init     Initialize Kanban system in current project
  claude-kanban check    Verify installation
  claude-kanban help     Show this help message

Examples:
  npx @findependence/claude-kanban init
  npx @findependence/claude-kanban check
`);
}

async function createKanbanStructure(analysis: ProjectAnalysis) {
  console.log('📁 Creating Kanban directory structure...');

  // Create status folders
  const statuses = ['todo', 'inprogress', 'done', 'parkinglot'];
  for (const status of statuses) {
    const dirPath = `docs/tasks/${status}`;
    fs.mkdirSync(dirPath, { recursive: true });

    // Create .gitkeep file
    fs.writeFileSync(path.join(dirPath, '.gitkeep'), '');
  }

  // Backup existing todo.md if needed
  if (analysis.hasTodoMd) {
    const content = fs.readFileSync('docs/tasks/todo.md', 'utf-8');
    if (content.length > 100) {
      fs.copyFileSync('docs/tasks/todo.md', 'docs/tasks/todo.md.backup');
      console.log('  ✅ Backed up existing todo.md');
    }
  }

  console.log('  ✅ Created status folders (todo, inprogress, done, parkinglot)');
}

async function installPlugin() {
  console.log('🔌 Installing Kanban plugin...');

  const pluginDir = '.claude/plugins/kanban';
  fs.mkdirSync(pluginDir, { recursive: true });
  fs.mkdirSync(path.join(pluginDir, 'hooks'), { recursive: true });

  // Create plugin.json
  const pluginJson = {
    name: 'kanban',
    description: 'Persistent Kanban system for Claude Code tasks',
    author: {
      name: 'Findependence',
      email: 'support@findependence.com'
    }
  };

  fs.writeFileSync(
    path.join(pluginDir, 'plugin.json'),
    JSON.stringify(pluginJson, null, 2)
  );

  // Create hooks.json
  const hooksJson = {
    description: 'Kanban task sync hooks',
    hooks: {
      PreToolUse: [
        {
          toolName: 'TaskCreate',
          hooks: [
            {
              type: 'command',
              command: 'node ${CLAUDE_CWD}/.kanhelper/dist/hooks/pre-tool.js'
            }
          ]
        }
      ],
      PostToolUse: [
        {
          toolName: 'TaskUpdate',
          hooks: [
            {
              type: 'command',
              command: 'node ${CLAUDE_CWD}/.kanhelper/dist/hooks/post-tool.js'
            }
          ]
        }
      ]
    }
  };

  fs.writeFileSync(
    path.join(pluginDir, 'hooks', 'hooks.json'),
    JSON.stringify(hooksJson, null, 2)
  );

  console.log('  ✅ Plugin installed');
}

async function installSkills() {
  console.log('⚡ Installing skills...');

  // Create kanboard skill
  const kanboardDir = '.claude/skills/kanboard';
  fs.mkdirSync(kanboardDir, { recursive: true});

  const kanboardSkill = `---
name: kanboard
description: Display text-based Kanban board in console
---

# Kanboard Skill

Displays all tasks organized by status in a text-based Kanban board.

When invoked, this skill executes:
\`node .kanhelper/dist/skills/kanboard.js\`

## Usage

Simply type \`/kanboard\` in Claude Code to view your current Kanban board.

## Board Structure

- **TODO**: Pending tasks
- **IN PROGRESS**: Active work
- **DONE**: Completed tasks
- **PARKING LOT**: Deferred/blocked tasks

Each card shows:
- Task title
- Session ID (first 8 characters)
`;

  fs.writeFileSync(path.join(kanboardDir, 'SKILL.md'), kanboardSkill);

  // Create kansync skill
  const kansyncDir = '.claude/skills/kansync';
  fs.mkdirSync(kansyncDir, { recursive: true });

  const kansyncSkill = `---
name: kansync
description: Manually sync task state with Kanban board
---

# Kansync Skill

Manually synchronizes the current task state with the Kanban board.

When invoked, this skill executes:
\`node .kanhelper/dist/skills/kansync.js\`

## Usage

Type \`/kansync\` in Claude Code to manually sync tasks.

## What It Does

- Scans all Kanban folders
- Verifies card consistency
- Reports sync status
`;

  fs.writeFileSync(path.join(kansyncDir, 'SKILL.md'), kansyncSkill);

  // Create kanhelp skill
  const kanhelpDir = '.claude/skills/kanhelp';
  fs.mkdirSync(kanhelpDir, { recursive: true });

  const kanhelpSkill = `---
name: kanhelp
description: Display all available Kanban commands and features
---

# Kanhelp Skill

Shows comprehensive help for the Claude Kanban system.

When invoked, this skill executes:
\`node .kanhelper/dist/skills/kanhelp.js\`

## Usage

Type \`/kanhelp\` in Claude Code to view the complete help guide.

## What It Shows

- Available skills and commands
- Native tools integration (TaskCreate, TaskUpdate)
- Status mapping between task statuses and folders
- Directory structure
- Card format examples
- Session recovery guide
- CLI commands
- Tips and best practices
- Resource links
`;

  fs.writeFileSync(path.join(kanhelpDir, 'SKILL.md'), kanhelpSkill);

  // Create kandoctor skill
  const kandoctorDir = '.claude/skills/kandoctor';
  fs.mkdirSync(kandoctorDir, { recursive: true });

  const kandoctorSkill = `---
name: kandoctor
description: Validate Kanban system installation and health
---

# Kandoctor Skill

Runs comprehensive diagnostics on the Kanban system installation.

When invoked, this skill executes:
\`node .kanhelper/dist/skills/kandoctor.js\`

## Usage

Type \`/kandoctor\` in Claude Code to run system diagnostics.

## What It Checks

- **Directory Structure**: All Kanban folders and index files
- **Kanban Helper**: Compiled code and dependencies
- **Plugin Installation**: Plugin config and hooks
- **Skills Installation**: All skill definitions
- **Configuration**: todo.md frontmatter, .gitignore settings
- **Session & Cards**: Current session and card counts

## Output

- ✅ Passed checks
- ⚠️  Warnings (non-critical issues)
- ❌ Failed checks (critical issues)
- Overall health percentage
- Recommendations for fixes
`;

  fs.writeFileSync(path.join(kandoctorDir, 'SKILL.md'), kandoctorSkill);

  console.log('  ✅ Skills installed (kanboard, kansync, kanhelp, kandoctor)');
}

// Run the CLI
main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
