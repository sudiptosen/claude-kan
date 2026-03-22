#!/usr/bin/env node
/**
 * Kandoctor skill - Validate Kanban system installation and health
 */

import fs from 'fs';
import path from 'path';
import { getSessionId } from '../core/session';

// ANSI color codes
const colors = {
  red: (text: string) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text: string) => `\x1b[33m${text}\x1b[0m`,
  green: (text: string) => `\x1b[32m${text}\x1b[0m`,
  blue: (text: string) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text: string) => `\x1b[36m${text}\x1b[0m`,
  gray: (text: string) => `\x1b[90m${text}\x1b[0m`,
  bold: (text: string) => `\x1b[1m${text}\x1b[0m`
};

interface DiagnosticResult {
  category: string;
  checks: Array<{
    name: string;
    status: 'pass' | 'fail' | 'warn';
    message: string;
    details?: string;
  }>;
}

function runDiagnostics(): DiagnosticResult[] {
  const results: DiagnosticResult[] = [];

  // 1. Directory Structure
  results.push({
    category: 'Directory Structure',
    checks: [
      checkDirectory('docs/tasks/pending', 'PENDING folder'),
      checkDirectory('docs/tasks/in_progress', 'IN PROGRESS folder'),
      checkDirectory('docs/tasks/completed', 'COMPLETED folder'),
      checkDirectory('docs/tasks/parkinglot', 'PARKING LOT folder'),
      checkDirectory('docs/tasks/deleted', 'DELETED folder'),
      checkFile('docs/tasks/todo.md', 'todo.md index file'),
      checkFile('docs/tasks/lessons.md', 'lessons.md file')
    ]
  });

  // 2. Kanban Helper
  results.push({
    category: 'Kanban Helper',
    checks: [
      checkDirectory('\.kanhelper', '\.kanhelper directory'),
      checkFile('\.kanhelper/package.json', 'package.json'),
      checkDirectory('\.kanhelper/dist', 'Compiled code (dist/)'),
      checkFile('\.kanhelper/dist/skills/kanboard.js', 'kanboard skill'),
      checkFile('\.kanhelper/dist/skills/kanboardfull.js', 'kanboardfull skill'),
      checkFile('\.kanhelper/dist/skills/kansync.js', 'kansync skill'),
      checkFile('\.kanhelper/dist/skills/kanhelp.js', 'kanhelp skill'),
      checkFile('\.kanhelper/dist/skills/kandoctor.js', 'kandoctor skill'),
      checkFile('\.kanhelper/dist/skills/kancreate.js', 'kancreate skill'),
      checkFile('\.kanhelper/dist/skills/kanupdate.js', 'kanupdate skill'),
      checkFile('\.kanhelper/dist/skills/kancard.js', 'kancard skill'),
      checkFile('\.kanhelper/dist/skills/kanprune.js', 'kanprune skill'),
      checkFile('\.kanhelper/dist/skills/kanboardweb.js', 'kanboardweb skill'),
      checkFile('\.kanhelper/dist/skills/session-debug.js', 'session-debug skill'),
      checkFile('\.kanhelper/dist/hooks/pre-tool.js', 'PreToolUse hook'),
      checkFile('\.kanhelper/dist/hooks/post-tool.js', 'PostToolUse hook')
    ]
  });

  // 3. Plugin Installation
  results.push({
    category: 'Plugin Installation',
    checks: [
      checkDirectory('.claude/plugins/kanban', 'Kanban plugin directory'),
      checkFile('.claude/plugins/kanban/plugin.json', 'plugin.json'),
      checkDirectory('.claude/plugins/kanban/hooks', 'Hooks directory'),
      checkFile('.claude/plugins/kanban/hooks/hooks.json', 'hooks.json'),
      validateHooksJson()
    ]
  });

  // 4. Skills Installation
  results.push({
    category: 'Skills Installation',
    checks: [
      checkDirectory('.claude/skills/kanboard', 'kanboard skill'),
      checkFile('.claude/skills/kanboard/SKILL.md', 'kanboard SKILL.md'),
      checkDirectory('.claude/skills/kanboardfull', 'kanboardfull skill'),
      checkFile('.claude/skills/kanboardfull/SKILL.md', 'kanboardfull SKILL.md'),
      checkDirectory('.claude/skills/kansync', 'kansync skill'),
      checkFile('.claude/skills/kansync/SKILL.md', 'kansync SKILL.md'),
      checkDirectory('.claude/skills/kanhelp', 'kanhelp skill'),
      checkFile('.claude/skills/kanhelp/SKILL.md', 'kanhelp SKILL.md'),
      checkDirectory('.claude/skills/kandoctor', 'kandoctor skill'),
      checkFile('.claude/skills/kandoctor/SKILL.md', 'kandoctor SKILL.md'),
      checkDirectory('.claude/skills/kancreate', 'kancreate skill'),
      checkFile('.claude/skills/kancreate/SKILL.md', 'kancreate SKILL.md'),
      checkDirectory('.claude/skills/kanupdate', 'kanupdate skill'),
      checkFile('.claude/skills/kanupdate/SKILL.md', 'kanupdate SKILL.md'),
      checkDirectory('.claude/skills/kancard', 'kancard skill'),
      checkFile('.claude/skills/kancard/SKILL.md', 'kancard SKILL.md'),
      checkDirectory('.claude/skills/kanprune', 'kanprune skill'),
      checkFile('.claude/skills/kanprune/SKILL.md', 'kanprune SKILL.md'),
      checkDirectory('.claude/skills/kanboardweb', 'kanboardweb skill'),
      checkFile('.claude/skills/kanboardweb/SKILL.md', 'kanboardweb SKILL.md'),
      checkDirectory('.claude/skills/session-debug', 'session-debug skill'),
      checkFile('.claude/skills/session-debug/SKILL.md', 'session-debug SKILL.md')
    ]
  });

  // 5. Configuration
  results.push({
    category: 'Configuration',
    checks: [
      checkTodoMdFrontmatter(),
      checkGitIgnore(),
      checkNodeModules()
    ]
  });

  // 6. Session & Cards
  results.push({
    category: 'Session & Cards',
    checks: [
      checkSessionStructure(),
      countCards('pending'),
      countCards('in_progress'),
      countCards('completed'),
      countCards('parkinglot'),
      countCards('deleted')
    ]
  });

  return results;
}

function checkDirectory(dirPath: string, name: string) {
  const exists = fs.existsSync(dirPath);
  return {
    name,
    status: exists ? 'pass' as const : 'fail' as const,
    message: exists ? 'Present' : 'Missing',
    details: exists ? undefined : `Expected at: ${dirPath}`
  };
}

function checkFile(filePath: string, name: string) {
  const exists = fs.existsSync(filePath);
  return {
    name,
    status: exists ? 'pass' as const : 'fail' as const,
    message: exists ? 'Present' : 'Missing',
    details: exists ? undefined : `Expected at: ${filePath}`
  };
}

function validateHooksJson() {
  const hookPath = '.claude/plugins/kanban/hooks/hooks.json';

  if (!fs.existsSync(hookPath)) {
    return {
      name: 'hooks.json validation',
      status: 'fail' as const,
      message: 'File missing',
      details: undefined
    };
  }

  try {
    const content = fs.readFileSync(hookPath, 'utf-8');
    const hooks = JSON.parse(content);

    const hasPreToolUse = hooks.hooks?.PreToolUse?.length > 0;
    const hasPostToolUse = hooks.hooks?.PostToolUse?.length > 0;

    if (hasPreToolUse && hasPostToolUse) {
      return {
        name: 'hooks.json validation',
        status: 'pass' as const,
        message: 'Valid (PreToolUse + PostToolUse)',
        details: undefined
      };
    } else {
      return {
        name: 'hooks.json validation',
        status: 'warn' as const,
        message: 'Missing hooks',
        details: `PreToolUse: ${hasPreToolUse}, PostToolUse: ${hasPostToolUse}`
      };
    }
  } catch (error) {
    return {
      name: 'hooks.json validation',
      status: 'fail' as const,
      message: 'Invalid JSON',
      details: error instanceof Error ? error.message : String(error)
    };
  }
}

function checkTodoMdFrontmatter() {
  const todoPath = 'docs/tasks/todo.md';

  if (!fs.existsSync(todoPath)) {
    return {
      name: 'todo.md frontmatter',
      status: 'fail' as const,
      message: 'File missing',
      details: undefined
    };
  }

  try {
    const content = fs.readFileSync(todoPath, 'utf-8');
    const hasFrontmatter = content.match(/^---\n[\s\S]*?\n---/);

    if (hasFrontmatter) {
      const hasSession = content.includes('currentSession');
      if (hasSession) {
        return {
          name: 'todo.md frontmatter',
          status: 'pass' as const,
          message: 'Valid with session tracking',
          details: undefined
        };
      } else {
        return {
          name: 'todo.md frontmatter',
          status: 'warn' as const,
          message: 'Missing session tracking',
          details: 'Run /kansync to initialize'
        };
      }
    } else {
      return {
        name: 'todo.md frontmatter',
        status: 'warn' as const,
        message: 'No frontmatter',
        details: 'Session tracking not initialized'
      };
    }
  } catch (error) {
    return {
      name: 'todo.md frontmatter',
      status: 'fail' as const,
      message: 'Cannot read file',
      details: error instanceof Error ? error.message : String(error)
    };
  }
}

function checkGitIgnore() {
  const gitignorePath = '.gitignore';

  if (!fs.existsSync(gitignorePath)) {
    return {
      name: '.gitignore configuration',
      status: 'warn' as const,
      message: 'No .gitignore found',
      details: undefined
    };
  }

  try {
    const content = fs.readFileSync(gitignorePath, 'utf-8');
    const hasKanbanEntries = content.includes('\.kanhelper/node_modules') ||
                            content.includes('\.kanhelper/dist');

    return {
      name: '.gitignore configuration',
      status: hasKanbanEntries ? 'pass' as const : 'warn' as const,
      message: hasKanbanEntries ? 'Kanban entries present' : 'Missing Kanban entries',
      details: hasKanbanEntries ? undefined : 'Add \.kanhelper/node_modules/ and \.kanhelper/dist/'
    };
  } catch (error) {
    return {
      name: '.gitignore configuration',
      status: 'warn' as const,
      message: 'Cannot read file',
      details: undefined
    };
  }
}

function checkNodeModules() {
  const nodeModulesPath = '\.kanhelper/node_modules';
  const exists = fs.existsSync(nodeModulesPath);

  return {
    name: 'Dependencies installed',
    status: exists ? 'pass' as const : 'warn' as const,
    message: exists ? 'node_modules present' : 'Dependencies not installed',
    details: exists ? undefined : 'Run: cd \.kanhelper && npm install'
  };
}

function checkSessionStructure() {
  const sessionId = getSessionId();
  const fromEnv = !!process.env.CLAUDE_SESSION_ID;

  if (sessionId === 'unknown') {
    return {
      name: 'Current session',
      status: 'fail' as const,
      message: 'No session ID detected',
      details: 'CLAUDE_SESSION_ID not set and no session files found in ~/.claude/projects/'
    };
  }

  const source = fromEnv ? 'environment variable' : 'Claude Code session files';

  return {
    name: 'Current session',
    status: 'pass' as const,
    message: `ID: ${sessionId.slice(0, 8)}... (${source})`,
    details: `Full session ID: ${sessionId}`
  };
}

function countCards(status: string) {
  const statusDir = path.join('docs/tasks', status);

  if (!fs.existsSync(statusDir)) {
    return {
      name: `${status.toUpperCase()} cards`,
      status: 'warn' as const,
      message: 'Folder missing',
      details: undefined
    };
  }

  try {
    let totalCards = 0;
    const sessions = fs.readdirSync(statusDir);

    for (const session of sessions) {
      const sessionPath = path.join(statusDir, session);
      if (!fs.statSync(sessionPath).isDirectory()) continue;

      const cards = fs.readdirSync(sessionPath).filter(f => f.endsWith('.md'));
      totalCards += cards.length;
    }

    return {
      name: `${status.toUpperCase()} cards`,
      status: 'pass' as const,
      message: `${totalCards} card${totalCards !== 1 ? 's' : ''}`,
      details: undefined
    };
  } catch (error) {
    return {
      name: `${status.toUpperCase()} cards`,
      status: 'warn' as const,
      message: 'Cannot read',
      details: error instanceof Error ? error.message : String(error)
    };
  }
}

function displayResults(results: DiagnosticResult[]) {
  console.log(colors.bold(colors.cyan('\n🏥 Kanban System Diagnostics\n')));

  let totalChecks = 0;
  let passedChecks = 0;
  let failedChecks = 0;
  let warnings = 0;

  for (const result of results) {
    console.log(colors.bold(colors.blue(`\n${result.category}:`)));

    for (const check of result.checks) {
      totalChecks++;

      let icon: string;
      let statusColor: (text: string) => string;

      if (check.status === 'pass') {
        icon = '✅';
        statusColor = colors.green;
        passedChecks++;
      } else if (check.status === 'fail') {
        icon = '❌';
        statusColor = colors.red;
        failedChecks++;
      } else {
        icon = '⚠️ ';
        statusColor = colors.yellow;
        warnings++;
      }

      console.log(`  ${icon} ${check.name}: ${statusColor(check.message)}`);

      if (check.details) {
        console.log(colors.gray(`     ${check.details}`));
      }
    }
  }

  // Summary
  console.log(colors.bold(colors.cyan('\n📊 Summary:\n')));
  console.log(`  Total checks: ${totalChecks}`);
  console.log(`  ${colors.green(`✅ Passed: ${passedChecks}`)}`);
  console.log(`  ${colors.yellow(`⚠️  Warnings: ${warnings}`)}`);
  console.log(`  ${colors.red(`❌ Failed: ${failedChecks}`)}`);

  // Overall health
  const healthPercentage = Math.round((passedChecks / totalChecks) * 100);
  console.log(colors.bold(colors.cyan('\n💊 Overall Health:')));

  if (healthPercentage >= 90) {
    console.log(colors.green(`  🎉 Excellent! (${healthPercentage}%)`));
  } else if (healthPercentage >= 70) {
    console.log(colors.yellow(`  ⚡ Good with minor issues (${healthPercentage}%)`));
  } else if (healthPercentage >= 50) {
    console.log(colors.yellow(`  ⚠️  Needs attention (${healthPercentage}%)`));
  } else {
    console.log(colors.red(`  🚨 Critical issues detected (${healthPercentage}%)`));
  }

  // Recommendations
  if (failedChecks > 0 || warnings > 0) {
    console.log(colors.bold(colors.yellow('\n💡 Recommendations:\n')));

    if (failedChecks > 0) {
      console.log('  1. Run: ' + colors.cyan('node \.kanhelper/dist/cli.js init'));
      console.log('     This will recreate missing structure');
    }

    if (warnings > 0) {
      console.log('  2. Check warnings above for specific fixes');
      console.log('  3. Run: ' + colors.cyan('/kansync') + ' to verify state');
    }
  }

  console.log('\n');
}

// Run diagnostics
if (require.main === module) {
  const results = runDiagnostics();
  displayResults(results);
}

export { runDiagnostics, displayResults };
