/**
 * Task card CRUD operations
 */

import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import { TaskCard, KanbanStatus } from './types';
import { getSessionId } from './session';

/**
 * Sanitize a card name for use as a filename
 */
function sanitizeCardName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with hyphens
    .replace(/[^a-z0-9-_]/g, '')    // Remove special characters
    .replace(/-+/g, '-')            // Collapse multiple hyphens
    .replace(/^-|-$/g, '');         // Remove leading/trailing hyphens
}

/**
 * Create a new task card in the Kanban structure
 */
export function createCard(
  subject: string,
  description: string,
  status: KanbanStatus = 'pending',
  taskId?: string,
  cardName?: string
): string {
  const sessionId = getSessionId();
  const timestamp = Date.now();

  // Use provided name or default to ITEM_{epoch_time}
  let fileName: string;
  if (cardName) {
    const sanitized = sanitizeCardName(cardName);
    fileName = sanitized ? `${sanitized}.md` : `ITEM_${timestamp}.md`;
  } else {
    fileName = `ITEM_${timestamp}.md`;
  }

  const dirPath = path.join('docs/tasks', status, sessionId);
  const filePath = path.join(dirPath, fileName);

  const card: TaskCard = {
    session: sessionId,
    status,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    subject,
    description,
    steps: []
  };

  if (taskId) {
    card.taskId = taskId;
  }

  const frontmatter = `---
session: ${card.session}
status: ${card.status}
created: ${card.created}
updated: ${card.updated}
${taskId ? `taskId: "${taskId}"\n` : ''}subject: ${card.subject}
description: ${card.description}
steps: []
---`;

  const content = `${frontmatter}

# ${card.subject}

${card.description}

## Steps
- [ ] TODO: Add implementation steps

## Notes
- Session: ${sessionId}
${taskId ? `- Task ID: ${taskId}\n` : ''}- Created: ${new Date(card.created).toLocaleString()}
`;

  fs.mkdirSync(dirPath, { recursive: true });
  fs.writeFileSync(filePath, content);

  return filePath;
}

/**
 * Move a card to a different status column
 */
export function moveCard(
  cardPath: string,
  newStatus: KanbanStatus
): string {
  if (!fs.existsSync(cardPath)) {
    throw new Error(`Card not found: ${cardPath}`);
  }

  const content = fs.readFileSync(cardPath, 'utf-8');
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

  if (!frontmatterMatch) {
    throw new Error(`Invalid card format (no frontmatter): ${cardPath}`);
  }

  const frontmatter = yaml.parse(frontmatterMatch[1]) as Partial<TaskCard>;
  frontmatter.status = newStatus;
  frontmatter.updated = new Date().toISOString();

  const sessionId = frontmatter.session || 'unknown';
  const fileName = path.basename(cardPath);
  const newPath = path.join('docs/tasks', newStatus, sessionId, fileName);

  // Update frontmatter
  const newFrontmatter = `---\n${yaml.stringify(frontmatter)}---\n`;
  const bodyMatch = content.match(/---\n[\s\S]*?\n---\n([\s\S]*)/);
  const body = bodyMatch ? bodyMatch[1] : '';
  const newContent = newFrontmatter + body;

  // Move file (create dir if needed)
  fs.mkdirSync(path.dirname(newPath), { recursive: true });
  fs.writeFileSync(newPath, newContent);

  // Delete old file (only if new path is different)
  if (cardPath !== newPath) {
    fs.unlinkSync(cardPath);
  }

  return newPath;
}

/**
 * Find a card by searching for it across all statuses
 * This is used to locate a card when we only have limited info
 */
export function findCardByTaskId(taskId: string): string | null {
  const statuses: KanbanStatus[] = ['pending', 'in_progress', 'completed', 'parkinglot', 'deleted'];

  for (const status of statuses) {
    const statusDir = path.join('docs/tasks', status);
    if (!fs.existsSync(statusDir)) continue;

    const sessions = fs.readdirSync(statusDir);
    for (const session of sessions) {
      const sessionPath = path.join(statusDir, session);
      if (!fs.statSync(sessionPath).isDirectory()) continue;

      const cards = fs.readdirSync(sessionPath).filter(f => f.endsWith('.md'));
      for (const card of cards) {
        const cardPath = path.join(sessionPath, card);

        // Check frontmatter first (reliable)
        const cardData = readCard(cardPath);
        if (cardData?.taskId === taskId) {
          return cardPath;
        }

        // Fallback: Check content (backward compatibility)
        const content = fs.readFileSync(cardPath, 'utf-8');
        if (content.includes(taskId)) {
          return cardPath;
        }
      }
    }
  }

  return null;
}

/**
 * Read a card and parse its frontmatter
 */
export function readCard(cardPath: string): TaskCard | null {
  if (!fs.existsSync(cardPath)) {
    return null;
  }

  const content = fs.readFileSync(cardPath, 'utf-8');
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

  if (!frontmatterMatch) {
    return null;
  }

  return yaml.parse(frontmatterMatch[1]) as TaskCard;
}

/**
 * Get all cards for a specific status
 */
export function getCardsByStatus(status: KanbanStatus): Array<{ path: string; card: TaskCard }> {
  const statusDir = path.join('docs/tasks', status);
  if (!fs.existsSync(statusDir)) {
    return [];
  }

  const results: Array<{ path: string; card: TaskCard }> = [];
  const sessions = fs.readdirSync(statusDir);

  for (const session of sessions) {
    const sessionPath = path.join(statusDir, session);
    if (!fs.statSync(sessionPath).isDirectory()) continue;

    const cards = fs.readdirSync(sessionPath).filter(f => f.endsWith('.md'));
    for (const cardFile of cards) {
      const cardPath = path.join(sessionPath, cardFile);
      const card = readCard(cardPath);
      if (card) {
        results.push({ path: cardPath, card });
      }
    }
  }

  return results;
}
