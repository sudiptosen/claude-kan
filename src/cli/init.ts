import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import * as readline from 'readline';
import {
  detectInstallationType,
  getCurrentVersion
} from './version.js';
import { createInstallationManifest } from './manifest.js';
import { createBackup, cleanOldBackups } from './backup.js';
import { runMigrations } from './migrations.js';
import { rollbackFromPath } from './rollback.js';
import { installFastSkills } from './fastSkills.js';

export interface InstallOptions {
  skipGitignore?: boolean;
}

export async function install(options: InstallOptions = {}) {
  const targetDir = process.cwd();

  console.log('\n┌─────────────────────────────────────┐');
  console.log(`│ 📦 Installing claude-kan v${getCurrentVersion()}     │`);
  console.log('└─────────────────────────────────────┘\n');

  // 1. Detect installation type
  const context = detectInstallationType();
  console.log(`✓ Detecting installation type... ${context.type.toUpperCase()}`);

  // 2. Check for user data
  if (context.hasUserData) {
    console.log(`✓ Checking for user data... Found task cards`);
  }

  // 3. Check for modifications
  if (context.hasModifications) {
    console.log(`✓ Checking for modifications... ⚠️  Local modifications detected`);
  }

  // 4. Handle different installation types
  if (context.type === 'downgrade') {
    // Warn about downgrade
    console.log(`\n⚠️  DOWNGRADE DETECTED\n`);
    console.log(`You are attempting to install an older version:`);
    console.log(`  Installed: v${context.installedVersion}`);
    console.log(`  Package:   v${context.currentVersion}`);
    console.log(`\nDowngrading may cause data compatibility issues.\n`);

    const confirmed = await confirm('Are you sure you want to downgrade?');
    if (!confirmed) {
      console.log('❌ Installation cancelled by user');
      return;
    }
  }

  // 5. User confirmation for upgrades with data
  if (context.type === 'upgrade' && context.hasUserData) {
    console.log(`\n⚠️  This will upgrade your claude-kan installation:`);
    console.log(`    From: v${context.installedVersion}`);
    console.log(`    To:   v${context.currentVersion}`);
    console.log(`\n    Your existing task cards will be preserved.`);
    console.log(`    A backup will be created before proceeding.\n`);

    const confirmed = await confirm('Continue with upgrade?');
    if (!confirmed) {
      console.log('❌ Installation cancelled by user');
      return;
    }
    console.log('✓ User confirmed upgrade\n');
  }

  // 6. User confirmation for .kanhelper/dist/ modifications
  if (context.hasModifications && context.type !== 'fresh') {
    console.log(`\n⚠️  WARNING: Local modifications detected\n`);
    console.log(`Files in .kanhelper/dist/ have been modified since installation.`);
    console.log(`These customizations will be OVERWRITTEN during ${context.type}.\n`);
    console.log(`Options:`);
    console.log(`  1. Continue and overwrite modifications (backup will be created)`);
    console.log(`  2. Cancel ${context.type} and preserve modifications\n`);

    const choice = await prompt('What would you like to do? (1/2)');
    if (choice !== '1') {
      console.log('❌ Installation cancelled by user');
      return;
    }
  }

  // 7. Create backup (if not fresh install)
  let backupPath: string | null = null;
  if (context.type !== 'fresh') {
    backupPath = await createBackup(`pre-${context.type}`);
  }

  try {
    // 8. Create directory structure
    createDirectories(targetDir);

    // 9. Copy skills (ALWAYS overwrite - these are system files)
    console.log('\n📝 Installing skills...');
    copySkillTemplates(targetDir);  // No backup, no checks - just overwrite

    // 10. SAFE update of compiled code (replaces unsafe deletion at lines 100-102)
    console.log('\n⚙️  Installing Kanban system...');
    copyCompiledCodeSafe(targetDir);  // Backed up above if needed

    // 11. Create initial task files
    createTaskFiles(targetDir);

    // 12. Update .gitignore
    if (!options.skipGitignore) {
      updateGitignore(targetDir);
    }

    // 13. Install fast-skills hook (user-global) — ALWAYS ON, no opt-out
    console.log('\n⚡ Installing fast-skills hook...');
    try {
      installFastSkills({ log: (msg) => console.log(msg) });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`  ⚠️  Fast-skills install encountered an issue: ${message}`);
    }

    // 14. Run migrations
    if (context.type === 'upgrade' && context.installedVersion) {
      await runMigrations(context.installedVersion, context.currentVersion);
    }

    // 15. Create or update installation manifest
    createInstallationManifest(context);

    // 16. Clean old backups
    if (context.type !== 'fresh') {
      await cleanOldBackups(5);
    }

    // 17. Run health check
    console.log('\n🏥 Running health check...\n');
    const healthPassed = runHealthCheck(targetDir);

    // 18. Success message
    console.log('\n' + '='.repeat(60));
    console.log('✅ Installation complete!');
    console.log('='.repeat(60) + '\n');

    if (context.type === 'upgrade') {
      console.log(`Upgraded from v${context.installedVersion} to v${context.currentVersion}`);
      if (backupPath) {
        console.log(`Backup saved at: ${backupPath}\n`);
      }
    }

    displaySuccessMessage(healthPassed);

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('\n❌ Installation failed:', message);

    // Attempt automatic rollback
    if (backupPath) {
      console.log('\n🔄 Attempting automatic recovery...');
      try {
        await rollbackFromPath(backupPath);
        console.log('✅ Recovered to previous state');
      } catch (rollbackError) {
        const rollbackMessage = rollbackError instanceof Error ? rollbackError.message : String(rollbackError);
        console.error('❌ Recovery failed:', rollbackMessage);
        console.log('\n💡 Manual recovery required:');
        console.log(`   Restore from backup: ${backupPath}`);
      }
    }

    throw new Error(`Installation failed: ${message}`);
  }
}

function createDirectories(targetDir: string) {
  console.log('📁 Creating directories...');

  const dirs = [
    '.claude/skills',
    '.kanhelper/dist',
    'docs/tasks/pending',
    'docs/tasks/in_progress',
    'docs/tasks/completed',
    'docs/tasks/parkinglot',
    'docs/tasks/deleted'
  ];

  for (const dir of dirs) {
    const fullPath = path.join(targetDir, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`  ✓ ${dir}`);
    } else {
      console.log(`  - ${dir} (already exists)`);
    }
  }
}

function copySkillTemplates(targetDir: string) {
  console.log('\n📝 Installing skills...');

  // Get the path to skill templates in the installed package
  const packageRoot = path.resolve(__dirname, '../..');
  const templatesDir = path.join(packageRoot, 'dist', 'templates', 'skill-templates');

  if (!fs.existsSync(templatesDir)) {
    throw new Error(`Skill templates not found at: ${templatesDir}`);
  }

  const skills = fs.readdirSync(templatesDir);

  for (const skill of skills) {
    const srcPath = path.join(templatesDir, skill);
    const destPath = path.join(targetDir, '.claude', 'skills', skill);

    if (fs.statSync(srcPath).isDirectory()) {
      copyRecursive(srcPath, destPath);
      console.log(`  ✓ ${skill}`);
    }
  }
}

// SAFE version - replaces unsafe deletion at old lines 100-102
function copyCompiledCodeSafe(targetDir: string) {
  // Copy dist folder
  const packageRoot = path.resolve(__dirname, '../..');
  const distSrc = path.join(packageRoot, 'dist');
  const distDest = path.join(targetDir, '.kanhelper', 'dist');

  // If exists, it's already backed up at this point (if needed)
  if (fs.existsSync(distDest)) {
    fs.rmSync(distDest, { recursive: true });
  }

  copyRecursive(distSrc, distDest);
  console.log('  ✓ Compiled code');

  // Copy package.json
  const pkgSrc = path.join(packageRoot, 'package.json');
  const pkgDest = path.join(targetDir, '.kanhelper', 'package.json');
  fs.copyFileSync(pkgSrc, pkgDest);
  console.log('  ✓ package.json');
}

function createTaskFiles(targetDir: string) {
  console.log('\n📋 Creating task files...');

  const todoPath = path.join(targetDir, 'docs', 'tasks', 'todo.md');
  if (!fs.existsSync(todoPath)) {
    const todoContent = `# Task Tracker

## Current Tasks

*Use /kancreate to add tasks*

## Completed

*Completed tasks move to docs/tasks/completed/*
`;
    fs.writeFileSync(todoPath, todoContent);
    console.log('  ✓ todo.md');
  } else {
    console.log('  - todo.md (already exists)');
  }

  const lessonsPath = path.join(targetDir, 'docs', 'tasks', 'lessons.md');
  if (!fs.existsSync(lessonsPath)) {
    const lessonsContent = `# Lessons Learned

## Session Notes

*Document key learnings and decisions here*
`;
    fs.writeFileSync(lessonsPath, lessonsContent);
    console.log('  ✓ lessons.md');
  } else {
    console.log('  - lessons.md (already exists)');
  }
}

function updateGitignore(targetDir: string) {
  console.log('\n🔧 Updating .gitignore...');

  const gitignorePath = path.join(targetDir, '.gitignore');
  let gitignoreContent = '';

  if (fs.existsSync(gitignorePath)) {
    gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
  }

  const kanbanEntries = [
    '# Claude Kanban',
    '.kanhelper/node_modules/',
    '.kanhelper/dist/',
    'docs/tasks/kb.html'
  ];

  const hasKanbanEntries = kanbanEntries.some(entry =>
    gitignoreContent.includes(entry)
  );

  if (!hasKanbanEntries) {
    const newContent = gitignoreContent.trim() + '\n\n' + kanbanEntries.join('\n') + '\n';
    fs.writeFileSync(gitignorePath, newContent);
    console.log('  ✓ Added Kanban entries');
  } else {
    console.log('  - Kanban entries already present');
  }
}

function runHealthCheck(targetDir: string): boolean {
  console.log('\n🏥 Running health check...\n');

  try {
    const healthScript = path.join(targetDir, '.kanhelper', 'dist', 'skills', 'kandoctor.js');

    if (!fs.existsSync(healthScript)) {
      console.log('  ⚠️  Health check script not found');
      return false;
    }

    execSync(`node "${healthScript}"`, {
      cwd: targetDir,
      stdio: 'inherit'
    });

    return true;
  } catch (error) {
    console.log('  ⚠️  Health check failed');
    return false;
  }
}

function displaySuccessMessage(healthPassed: boolean) {
  console.log('\n' + '='.repeat(60));
  console.log('✅ Installation complete!');
  console.log('='.repeat(60));

  if (healthPassed) {
    console.log('\n✨ All systems operational!');
  } else {
    console.log('\n⚠️  Some checks failed. Review output above.');
  }

  console.log('\n📚 Next steps:');
  console.log('  1. Type /kanhelp in Claude Code to see all commands');
  console.log('  2. Type /kanboard to view your Kanban board');
  console.log('  3. Type /kancreate to create your first task');
  console.log('\n💡 Tip: Use /kandoctor anytime to check system health\n');
}

function copyRecursive(src: string, dest: string) {
  if (!fs.existsSync(src)) {
    throw new Error(`Source path does not exist: ${src}`);
  }

  const stat = fs.statSync(src);

  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const files = fs.readdirSync(src);

    for (const file of files) {
      const srcPath = path.join(src, file);
      const destPath = path.join(dest, file);
      copyRecursive(srcPath, destPath);
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Helper for user confirmation
async function confirm(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(`${message} (Y/n) `, answer => {
      rl.close();
      resolve(answer.toLowerCase() !== 'n');
    });
  });
}

// Helper for user input
async function prompt(message: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(message + ' ', answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}
