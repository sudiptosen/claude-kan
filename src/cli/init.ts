import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export interface InstallOptions {
  skipGitignore?: boolean;
}

export async function install(options: InstallOptions = {}) {
  const targetDir = process.cwd();

  console.log('\n📦 Installing claude-kan...\n');

  try {
    // 1. Create directory structure
    createDirectories(targetDir);

    // 2. Copy skill templates
    copySkillTemplates(targetDir);

    // 3. Copy compiled code
    copyCompiledCode(targetDir);

    // 4. Create initial task files
    createTaskFiles(targetDir);

    // 5. Update .gitignore
    if (!options.skipGitignore) {
      updateGitignore(targetDir);
    }

    // 6. Run health check
    const healthPassed = runHealthCheck(targetDir);

    // 7. Show success message
    displaySuccessMessage(healthPassed);

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
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

function copyCompiledCode(targetDir: string) {
  console.log('\n⚙️  Installing Kanban system...');

  // Copy dist folder
  const packageRoot = path.resolve(__dirname, '../..');
  const distSrc = path.join(packageRoot, 'dist');
  const distDest = path.join(targetDir, '.kanhelper', 'dist');

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
