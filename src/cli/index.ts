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
  npx claude-kan init              Install Kanban system in current project
  npx claude-kan init --skip-gitignore  Skip .gitignore updates
  npx claude-kan rollback          Rollback to previous version
  npx claude-kan rollback <name>   Rollback to specific backup
  npx claude-kan list-backups      List all available backups
  npx claude-kan --help            Show this help message
  npx claude-kan --version         Show version

After installation, use these skills in Claude Code:
  /kanboard       View Kanban board
  /kancreate      Create new card
  /kanupdate      Update card status
  /kancard        View card details
  /kanhelp        Show all commands
  /kandoctor      Run health check

Documentation: https://github.com/sudiptosen/claude-kan
  `);
}

function showVersion() {
  const packageJson = require('../../package.json');
  console.log(`claude-kan v${packageJson.version}`);
}

main();
