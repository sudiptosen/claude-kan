/**
 * Conflict detection for installation
 */

import fs from 'fs';
import { ProjectAnalysis, Conflict } from './types';

/**
 * Analyze the current project structure
 */
export function analyzeProject(): ProjectAnalysis {
  return {
    hasTasksDir: fs.existsSync('docs/tasks'),
    hasTodoMd: fs.existsSync('docs/tasks/todo.md'),
    hasLessonsMd: fs.existsSync('docs/tasks/lessons.md'),
    isGitRepo: fs.existsSync('.git'),
    hasClaudeDir: fs.existsSync('.claude'),
    projectRoot: process.cwd()
  };
}

/**
 * Detect potential conflicts before installation
 */
export function detectConflicts(analysis: ProjectAnalysis): Conflict[] {
  const conflicts: Conflict[] = [];

  // Check if todo.md exists and has content
  if (analysis.hasTodoMd) {
    const content = fs.readFileSync('docs/tasks/todo.md', 'utf-8');
    if (content.length > 100) {
      conflicts.push({
        file: 'docs/tasks/todo.md',
        message: 'Existing todo.md has content',
        resolution: 'Will backup to todo.md.backup before modifying',
        severity: 'warning'
      });
    }
  }

  // Check if Kanban folders already exist
  const kanbanFolders = ['todo', 'inprogress', 'done', 'parkinglot'];
  for (const folder of kanbanFolders) {
    if (fs.existsSync(`docs/tasks/${folder}`)) {
      conflicts.push({
        file: `docs/tasks/${folder}`,
        message: 'Folder already exists',
        resolution: 'Will merge existing files into Kanban structure',
        severity: 'warning'
      });
    }
  }

  // Check if .claude directory exists
  if (!analysis.hasClaudeDir) {
    conflicts.push({
      file: '.claude/',
      message: '.claude directory does not exist',
      resolution: 'Will create .claude/plugins/kanban/ and .claude/skills/',
      severity: 'error'
    });
  } else {
    // Check if kanban plugin already exists
    if (fs.existsSync('.claude/plugins/kanban')) {
      conflicts.push({
        file: '.claude/plugins/kanban',
        message: 'Kanban plugin already installed',
        resolution: 'Will overwrite with new version',
        severity: 'warning'
      });
    }
  }

  // Check if .kanhelper already exists
  if (fs.existsSync('.kanhelper')) {
    conflicts.push({
      file: '.kanhelper/',
      message: '.kanhelper directory already exists',
      resolution: 'Will update scripts to latest version',
      severity: 'warning'
    });
  }

  return conflicts;
}
