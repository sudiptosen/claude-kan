/**
 * Session tracking utilities
 */

import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import { TodoIndexMetadata } from './types';

/**
 * Get the current Claude Code session ID
 * Tries multiple sources in priority order:
 * 1. Environment variable CLAUDE_SESSION_ID
 * 2. Most recently modified session file in Claude Code's project directory
 * 3. Fallback to 'unknown'
 */
export function getSessionId(): string {
  // Try environment variable first
  if (process.env.CLAUDE_SESSION_ID) {
    return process.env.CLAUDE_SESSION_ID;
  }

  // Try to find current session from Claude Code's files
  try {
    const projectPath = process.cwd();
    const sanitizedPath = projectPath.replace(/\//g, '-').substring(1);
    const sessionsDir = path.join(
      process.env.HOME || '~',
      '.claude/projects',
      `-${sanitizedPath}`
    );

    if (fs.existsSync(sessionsDir)) {
      // Find the most recently modified .jsonl file
      const files = fs.readdirSync(sessionsDir)
        .filter(f => f.endsWith('.jsonl'))
        .map(f => ({
          name: f,
          path: path.join(sessionsDir, f),
          mtime: fs.statSync(path.join(sessionsDir, f)).mtime.getTime()
        }))
        .sort((a, b) => b.mtime - a.mtime);

      if (files.length > 0) {
        // Extract session ID from filename (remove .jsonl extension)
        const sessionId = files[0].name.replace('.jsonl', '');
        return sessionId;
      }
    }
  } catch (error) {
    // If we can't determine session, fall through to default
  }

  return 'unknown';
}

/**
 * Update the todo.md index file with task reference and session info
 */
export function updateTodoIndex(taskFile: string, sessionId: string): void {
  const todoPath = 'docs/tasks/todo.md';

  if (!fs.existsSync(todoPath)) {
    throw new Error(`todo.md not found at ${todoPath}`);
  }

  let content = fs.readFileSync(todoPath, 'utf-8');

  // Parse existing frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  let frontmatter: TodoIndexMetadata;

  if (frontmatterMatch) {
    const parsed = yaml.parse(frontmatterMatch[1]);
    frontmatter = {
      lastSession: parsed.currentSession || null,
      currentSession: sessionId,
      updatedAt: new Date().toISOString()
    };
  } else {
    // No frontmatter exists, create new
    frontmatter = {
      lastSession: null,
      currentSession: sessionId,
      updatedAt: new Date().toISOString()
    };
  }

  // Create task reference
  const relativePath = path.relative('docs/tasks', taskFile);
  const taskEntry = `- [ ] ${relativePath} (Session: ${sessionId.slice(0, 8)})`;

  // Reconstruct content
  const newFrontmatter = `---\n${yaml.stringify(frontmatter)}---\n`;

  // Extract body (everything after frontmatter, or entire content if no frontmatter)
  let body: string;
  if (frontmatterMatch) {
    const bodyMatch = content.match(/---\n[\s\S]*?\n---\n([\s\S]*)/);
    body = bodyMatch ? bodyMatch[1] : '';
  } else {
    body = content;
  }

  // Append task entry to body
  const updatedContent = newFrontmatter + body.trim() + '\n\n' + taskEntry + '\n';

  fs.writeFileSync(todoPath, updatedContent);
}

/**
 * Get session info from todo.md
 */
export function getSessionInfo(): TodoIndexMetadata | null {
  const todoPath = 'docs/tasks/todo.md';

  if (!fs.existsSync(todoPath)) {
    return null;
  }

  const content = fs.readFileSync(todoPath, 'utf-8');
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

  if (!frontmatterMatch) {
    return null;
  }

  return yaml.parse(frontmatterMatch[1]) as TodoIndexMetadata;
}
