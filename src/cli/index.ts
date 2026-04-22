#!/usr/bin/env node
/**
 * claude-kan CLI entry point
 *
 * Usage:
 *   npx claude-kan init         # Install in current project
 *   npx claude-kan --help       # Show help
 *   npx claude-kan --version    # Show version
 */

import { install } from './init.js';
import { rollback, listBackups } from './rollback.js';
import {
  uninstallFastSkills,
  checkFastSkills
} from './fastSkills.js';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === '--help' || command === '-h') {
    showHelp();
    process.exit(0);
  }

  if (command === '--version' || command === '-v') {
    showVersion();
    process.exit(0);
  }

  if (command === 'init') {
    const options = {
      skipGitignore: args.includes('--skip-gitignore')
    };

    try {
      await install(options);
      process.exit(0);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('❌ Installation failed:', message);
      process.exit(1);
    }
  }

  if (command === 'fast-skills') {
    try {
      await handleFastSkillsCommand(args.slice(1));
      process.exit(0);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('❌ fast-skills command failed:', message);
      process.exit(1);
    }
  }

  if (command === 'check') {
    try {
      runCheck();
      process.exit(0);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('❌ check failed:', message);
      process.exit(1);
    }
  }

  if (command === 'rollback') {
    const backupName = args[1];
    try {
      await rollback(backupName);
      process.exit(0);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('❌ Rollback failed:', message);
      process.exit(1);
    }
  }

  if (command === 'list-backups') {
    try {
      listBackups();
      process.exit(0);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('❌ Failed to list backups:', message);
      process.exit(1);
    }
  }

  console.error(`Unknown command: ${command}`);
  showHelp();
  process.exit(1);
}

function showHelp() {
  console.log(`
claude-kan - Persistent Kanban system for Claude Code

Usage:
  npx claude-kan init                     Install Kanban system in current project
                                          (fast-skills hook is installed automatically)
  npx claude-kan init --skip-gitignore    Skip .gitignore updates
  npx claude-kan check                    Verify installation (incl. fast-skills)
  npx claude-kan fast-skills --status     Show fast-skills install state (diagnostic)
  npx claude-kan fast-skills --disable    Escape hatch: remove fast-skills hook +
                                          settings entry. Re-run 'init' to restore.
  npx claude-kan rollback                 Rollback to previous version
  npx claude-kan rollback <name>          Rollback to specific backup
  npx claude-kan list-backups             List all available backups
  npx claude-kan --help                   Show this help message
  npx claude-kan --version                Show version

After installation, use these skills in Claude Code:
  /kanboard       View Kanban board
  /kancreate      Create new card
  /kanupdate      Update card status
  /kancard        View card details
  /kanhelp        Show all commands (fast-path enabled by default)
  /kandoctor      Run health check

Documentation: https://github.com/sudiptosen/claude-kan
  `);
}

async function handleFastSkillsCommand(args: string[]): Promise<void> {
  // fast-skills is ALWAYS ON — installed unconditionally by `init`.
  // This subcommand exists only for diagnostics (--status) and as an
  // escape hatch (--disable). There is no --enable; re-run `init` to
  // restore the hook.
  const mode = args[0] ?? '--status';

  if (mode === '--disable' || mode === 'disable') {
    console.log('🧹 Removing fast-skills hook (escape hatch)...');
    const removeConfig = args.includes('--purge-config');
    uninstallFastSkills({ log: (msg) => console.log(msg), removeConfig });
    console.log('\n✅ fast-skills disabled. Re-run `npx claude-kan init` to restore.');
    return;
  }

  if (mode === '--status' || mode === 'status') {
    const status = checkFastSkills();
    console.log('⚡ fast-skills status');
    console.log(`  Hook script:         ${status.hookInstalled ? '✅' : '❌'} ${status.paths.hookScript}`);
    console.log(`  Executable:          ${status.hookExecutable ? '✅' : '❌'}`);
    console.log(`  Config file:         ${status.configInstalled ? '✅' : '❌'} ${status.paths.hookConfig}`);
    console.log(`  Registered in:       ${status.registeredInSettings ? '✅' : '❌'} ${status.paths.settingsFile}`);
    if (status.enabledSkills.length > 0) {
      console.log(`  Enabled skills:      ${status.enabledSkills.join(', ')}`);
    } else {
      console.log(`  Enabled skills:      (none — hook will default to kanhelp)`);
    }
    return;
  }

  console.error(`Unknown fast-skills mode: ${mode}`);
  console.error('Use --status (diagnostic) or --disable (escape hatch).');
  console.error('To (re)install fast-skills, run: npx claude-kan init');
  process.exit(1);
}

function runCheck(): void {
  console.log('🔍 Checking claude-kan installation...\n');

  const fs = require('fs') as typeof import('fs');
  const path = require('path') as typeof import('path');
  const cwd = process.cwd();

  // Project-local checks
  const statuses = ['pending', 'in_progress', 'completed', 'parkinglot', 'deleted'];
  console.log('Kanban structure:');
  for (const status of statuses) {
    const exists = fs.existsSync(path.join(cwd, 'docs/tasks', status));
    console.log(`  ${exists ? '✅' : '❌'} docs/tasks/${status}/`);
  }

  console.log('\nHelper code:');
  console.log(`  ${fs.existsSync(path.join(cwd, '.kanhelper/dist')) ? '✅' : '❌'} .kanhelper/dist/`);
  console.log(`  ${fs.existsSync(path.join(cwd, '.kanhelper/dist/skills/kanhelp.js')) ? '✅' : '❌'} .kanhelper/dist/skills/kanhelp.js`);

  console.log('\nSkill definitions:');
  const skills = ['kanboard', 'kanboardfull', 'kanboardweb', 'kancreate', 'kanupdate', 'kancard', 'kanhelp', 'kandoctor', 'kanprune', 'kansync'];
  for (const s of skills) {
    const p = path.join(cwd, '.claude/skills', s, 'SKILL.md');
    console.log(`  ${fs.existsSync(p) ? '✅' : '❌'} .claude/skills/${s}/SKILL.md`);
  }

  // Fast-skills (user-global) check
  console.log('\nFast-skills (UserPromptSubmit hook):');
  const status = checkFastSkills();
  console.log(`  ${status.hookInstalled ? '✅' : '❌'} hook script:      ${status.paths.hookScript}`);
  console.log(`  ${status.hookExecutable ? '✅' : '❌'} executable`);
  console.log(`  ${status.configInstalled ? '✅' : '❌'} config file:      ${status.paths.hookConfig}`);
  console.log(`  ${status.registeredInSettings ? '✅' : '❌'} registered in:   ${status.paths.settingsFile}`);
  if (status.enabledSkills.length > 0) {
    console.log(`     enabled skills:   ${status.enabledSkills.join(', ')}`);
  }
}

function showVersion() {
  const packageJson = require('../../package.json');
  console.log(`claude-kan v${packageJson.version}`);
}

main();
