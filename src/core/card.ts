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
  cardName?: string,
  customSteps?: string[]
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

  // Generate steps: use custom if provided, otherwise auto-generate
  const steps = customSteps && customSteps.length > 0
    ? customSteps
    : generateSteps(subject, description);

  const card: TaskCard = {
    session: sessionId,
    status,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    subject,
    description,
    steps
  };

  if (taskId) {
    card.taskId = taskId;
  }

  // Escape and format strings for YAML
  const escapeYamlString = (str: string): string => {
    // Use literal block style for multiline strings
    if (str.includes('\n')) {
      return '|-\n  ' + str.split('\n').join('\n  ');
    }
    // Use quoted string for single line
    return `"${str.replace(/"/g, '\\"')}"`;
  };

  // Format steps for YAML (preserve as array)
  const stepsYaml = steps.length > 0
    ? steps.map(s => `  - "${s.replace(/"/g, '\\"')}"`).join('\n')
    : '  []';

  const frontmatter = `---
session: ${card.session}
status: ${card.status}
created: ${card.created}
updated: ${card.updated}
${taskId ? `taskId: "${taskId}"\n` : ''}subject: ${escapeYamlString(card.subject)}
description: ${escapeYamlString(card.description)}
steps:
${stepsYaml}
---`;

  const stepsMarkdown = steps.join('\n');
  const content = `${frontmatter}

# ${card.subject}

${card.description}

## Steps
${stepsMarkdown}

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

/**
 * Checkbox progress interface
 */
export interface CheckboxProgress {
  total: number;
  completed: number;
  percentage: number;
  steps: Array<{ text: string; completed: boolean }>;
}

/**
 * Parse checkbox progress from card steps
 * Supports markdown checkbox syntax: - [ ] unchecked, - [x] checked
 */
export function parseCheckboxProgress(steps: string[]): CheckboxProgress {
  const checkboxRegex = /^- \[([ xX])\] (.+)$/;
  const parsedSteps: Array<{ text: string; completed: boolean }> = [];
  let completed = 0;

  for (const step of steps) {
    const match = step.match(checkboxRegex);
    if (match) {
      const isCompleted = match[1].toLowerCase() === 'x';
      parsedSteps.push({ text: match[2], completed: isCompleted });
      if (isCompleted) completed++;
    } else {
      // Non-checkbox step - treat as uncompleted
      parsedSteps.push({ text: step.replace(/^- /, ''), completed: false });
    }
  }

  const total = parsedSteps.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { total, completed, percentage, steps: parsedSteps };
}

/**
 * Generate default steps based on subject and description
 * Hybrid approach: parse description for lists, or use template
 */
export function generateSteps(subject: string, description: string): string[] {
  // Try to extract steps from description first
  const extractedSteps = extractStepsFromDescription(description);
  if (extractedSteps.length > 0) {
    return extractedSteps;
  }

  // Fallback to template-based generation
  return [
    '- [ ] Plan and design approach',
    '- [ ] Implement changes',
    '- [ ] Test functionality',
    '- [ ] Review and refine',
    '- [ ] Mark complete'
  ];
}

/**
 * Extract steps from description text
 * Looks for numbered lists, bulleted lists, or line breaks
 */
function extractStepsFromDescription(description: string): string[] {
  if (!description || description.trim().length === 0) {
    return [];
  }

  const steps: string[] = [];
  const lines = description.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  for (const line of lines) {
    // Match numbered lists: 1. Step, 1) Step
    const numberedMatch = line.match(/^\d+[\.)]\s*(.+)$/);
    if (numberedMatch) {
      steps.push(`- [ ] ${numberedMatch[1]}`);
      continue;
    }

    // Match bulleted lists: - Step, * Step
    const bulletMatch = line.match(/^[-*]\s*(.+)$/);
    if (bulletMatch) {
      steps.push(`- [ ] ${bulletMatch[1]}`);
      continue;
    }

    // Match checkbox format: - [ ] Step, - [x] Step
    const checkboxMatch = line.match(/^- \[([ xX])\] (.+)$/);
    if (checkboxMatch) {
      steps.push(line);
      continue;
    }
  }

  return steps;
}

/**
 * Update checkbox state in a card
 * @param cardPath Path to the card file
 * @param stepIndex Index of the step to toggle (0-based)
 * @param completed New completion state (optional, defaults to toggle)
 */
export function updateCheckbox(
  cardPath: string,
  stepIndex: number,
  completed?: boolean
): void {
  if (!fs.existsSync(cardPath)) {
    throw new Error(`Card not found: ${cardPath}`);
  }

  const content = fs.readFileSync(cardPath, 'utf-8');
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

  if (!frontmatterMatch) {
    throw new Error(`Invalid card format (no frontmatter): ${cardPath}`);
  }

  const frontmatter = yaml.parse(frontmatterMatch[1]) as Partial<TaskCard>;
  const steps = frontmatter.steps || [];

  if (stepIndex < 0 || stepIndex >= steps.length) {
    throw new Error(`Invalid step index: ${stepIndex}. Card has ${steps.length} steps.`);
  }

  const step = steps[stepIndex];
  const checkboxRegex = /^- \[([ xX])\] (.+)$/;
  const match = step.match(checkboxRegex);

  if (!match) {
    throw new Error(`Step ${stepIndex} is not a checkbox: "${step}"`);
  }

  const currentState = match[1].toLowerCase() === 'x';
  const newState = completed !== undefined ? completed : !currentState;
  const newCheckbox = newState ? 'x' : ' ';
  steps[stepIndex] = `- [${newCheckbox}] ${match[2]}`;

  frontmatter.steps = steps;
  frontmatter.updated = new Date().toISOString();

  // Update frontmatter
  const newFrontmatter = `---\n${yaml.stringify(frontmatter)}---\n`;
  const bodyMatch = content.match(/---\n[\s\S]*?\n---\n([\s\S]*)/);
  const body = bodyMatch ? bodyMatch[1] : '';

  // Update Steps section in body
  const stepsMarkdown = steps.join('\n');
  const updatedBody = body.replace(
    /## Steps\n[\s\S]*?(?=\n##|$)/,
    `## Steps\n${stepsMarkdown}\n`
  );

  const newContent = newFrontmatter + updatedBody;
  fs.writeFileSync(cardPath, newContent);
}

/**
 * Regenerate steps for a card, preserving checked items
 * @param cardPath Path to the card file
 * @param newSubject Optional new subject for regeneration
 * @param newDescription Optional new description for regeneration
 */
export function regenerateSteps(
  cardPath: string,
  newSubject?: string,
  newDescription?: string
): void {
  if (!fs.existsSync(cardPath)) {
    throw new Error(`Card not found: ${cardPath}`);
  }

  const content = fs.readFileSync(cardPath, 'utf-8');
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

  if (!frontmatterMatch) {
    throw new Error(`Invalid card format (no frontmatter): ${cardPath}`);
  }

  const frontmatter = yaml.parse(frontmatterMatch[1]) as Partial<TaskCard>;
  const currentSteps = frontmatter.steps || [];

  // Preserve checked items
  const checkedSteps = currentSteps.filter(step => {
    const match = step.match(/^- \[([xX])\] (.+)$/);
    return match && match[1].toLowerCase() === 'x';
  });

  // Generate new steps
  const subjectForGeneration = newSubject || frontmatter.subject || '';
  const description = newDescription || frontmatter.description || '';
  const generatedSteps = generateSteps(subjectForGeneration, description);

  // Combine: checked items first, then new unchecked items
  const finalSteps = [...checkedSteps, ...generatedSteps];

  frontmatter.steps = finalSteps;
  frontmatter.updated = new Date().toISOString();

  // Update frontmatter
  const newFrontmatter = `---\n${yaml.stringify(frontmatter)}---\n`;
  const bodyMatch = content.match(/---\n[\s\S]*?\n---\n([\s\S]*)/);
  const body = bodyMatch ? bodyMatch[1] : '';

  // Update Steps section in body
  const stepsMarkdown = finalSteps.join('\n');
  const updatedBody = body.replace(
    /## Steps\n[\s\S]*?(?=\n##|$)/,
    `## Steps\n${stepsMarkdown}\n`
  );

  const newContent = newFrontmatter + updatedBody;
  fs.writeFileSync(cardPath, newContent);
}
