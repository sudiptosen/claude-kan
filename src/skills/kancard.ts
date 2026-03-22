#!/usr/bin/env node
/**
 * Kancard skill - Query and display individual card details
 */

import fs from 'fs';
import path from 'path';
import { getKanbanBoard } from '../core/kanban';
import { findCardByTaskId, readCard } from '../core/card';

// ANSI styling
const colors = {
  yellow: (text: string) => `\x1b[33m${text}\x1b[0m`,
  blue: (text: string) => `\x1b[34m${text}\x1b[0m`,
  green: (text: string) => `\x1b[32m${text}\x1b[0m`,
  gray: (text: string) => `\x1b[90m${text}\x1b[0m`,
  cyan: (text: string) => `\x1b[36m${text}\x1b[0m`,
  red: (text: string) => `\x1b[31m${text}\x1b[0m`,
  bold: (text: string) => `\x1b[1m${text}\x1b[0m`,
  dim: (text: string) => `\x1b[2m${text}\x1b[0m`
};

interface CardLocation {
  path: string;
  card: any;
  status: string;
}

/**
 * Find a card by various criteria: taskId, title substring, or session
 */
function findCard(query: string): CardLocation | null {
  const board = getKanbanBoard();
  const statuses = ['pending', 'in_progress', 'completed', 'parkinglot', 'deleted'];

  // Try to find by taskId first (most specific)
  const cardPath = findCardByTaskId(query);
  if (cardPath) {
    const card = readCard(cardPath);
    if (card) {
      const status = cardPath.includes('/pending/') ? 'pending' :
                     cardPath.includes('/in_progress/') ? 'in_progress' :
                     cardPath.includes('/completed/') ? 'completed' :
                     cardPath.includes('/parkinglot/') ? 'parkinglot' : 'deleted';
      return { path: cardPath, card, status };
    }
  }

  // Search by title or session in all columns
  for (const status of statuses) {
    const statusDir = path.join('docs/tasks', status);
    if (!fs.existsSync(statusDir)) continue;

    const sessions = fs.readdirSync(statusDir);
    for (const session of sessions) {
      const sessionPath = path.join(statusDir, session);
      if (!fs.statSync(sessionPath).isDirectory()) continue;

      // Check if query matches session (partial match)
      if (session.toLowerCase().includes(query.toLowerCase())) {
        const cards = fs.readdirSync(sessionPath).filter(f => f.endsWith('.md'));
        if (cards.length > 0) {
          const cardPath = path.join(sessionPath, cards[0]);
          const card = readCard(cardPath);
          if (card) {
            return { path: cardPath, card, status };
          }
        }
      }

      // Check each card for title match
      const cards = fs.readdirSync(sessionPath).filter(f => f.endsWith('.md'));
      for (const cardFile of cards) {
        const cardPath = path.join(sessionPath, cardFile);
        const card = readCard(cardPath);

        if (card && card.subject && card.subject.toLowerCase().includes(query.toLowerCase())) {
          return { path: cardPath, card, status };
        }
      }
    }
  }

  return null;
}

/**
 * Display detailed card information
 */
function displayCard(query: string) {
  try {
    const result = findCard(query);

    if (!result) {
      console.log(colors.red('❌ Card not found'));
      console.log(colors.dim(`\nSearched for: "${query}"`));
      console.log(colors.dim('Try one of:'));
      console.log(colors.dim('  - Task ID (e.g., "3")'));
      console.log(colors.dim('  - Card title (e.g., "Update Version")'));
      console.log(colors.dim('  - Session ID (e.g., "a6bfbcfd")'));
      process.exit(1);
    }

    const { card, status, path: cardPath } = result;

    // Status color and symbol
    const statusDisplay =
      status === 'pending' ? colors.yellow('⏳ PENDING') :
      status === 'in_progress' ? colors.blue('▶ IN PROGRESS') :
      status === 'completed' ? colors.green('✓ COMPLETED') :
      status === 'parkinglot' ? colors.gray('◼ PARKING LOT') :
      colors.red('✗ DELETED');

    // Header
    console.log(colors.bold(colors.cyan('\n┌─ CARD DETAILS')));
    console.log(colors.dim('│'));

    // Title
    console.log(colors.dim('├─ ') + colors.bold('Title'));
    console.log(colors.dim('│  ') + card.subject);
    console.log(colors.dim('│'));

    // Status
    console.log(colors.dim('├─ ') + colors.bold('Status'));
    console.log(colors.dim('│  ') + statusDisplay);
    console.log(colors.dim('│'));

    // Task ID (if present)
    if (card.taskId) {
      console.log(colors.dim('├─ ') + colors.bold('Task ID'));
      console.log(colors.dim('│  ') + card.taskId);
      console.log(colors.dim('│'));
    }

    // Session
    console.log(colors.dim('├─ ') + colors.bold('Session'));
    console.log(colors.dim('│  ') + card.session);
    console.log(colors.dim('│'));

    // Timestamps
    console.log(colors.dim('├─ ') + colors.bold('Created'));
    console.log(colors.dim('│  ') + new Date(card.created).toLocaleString());
    console.log(colors.dim('│'));

    console.log(colors.dim('├─ ') + colors.bold('Updated'));
    console.log(colors.dim('│  ') + new Date(card.updated).toLocaleString());
    console.log(colors.dim('│'));

    // Description
    if (card.description) {
      console.log(colors.dim('├─ ') + colors.bold('Description'));
      console.log(colors.dim('│  ') + card.description);
      console.log(colors.dim('│'));
    }

    // Steps (if any)
    if (card.steps && card.steps.length > 0) {
      console.log(colors.dim('├─ ') + colors.bold('Steps'));
      card.steps.forEach((step: string, idx: number) => {
        const isLast = idx === card.steps.length - 1;
        const prefix = isLast ? '└─' : '├─';
        console.log(colors.dim('│  ' + prefix) + ' ' + step);
      });
      console.log(colors.dim('│'));
    }

    // File path
    console.log(colors.dim('├─ ') + colors.bold('File Path'));
    console.log(colors.dim('│  ') + cardPath);

    // Footer
    console.log(colors.dim('└─\n'));

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error displaying card:', message);
    process.exit(1);
  }
}

// Parse arguments
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log(colors.red('❌ Error: Query required'));
  console.log(colors.dim('\nUsage: /kancard <query>'));
  console.log(colors.dim('\nExamples:'));
  console.log(colors.dim('  /kancard 3              # Query by task ID'));
  console.log(colors.dim('  /kancard "Update"       # Query by title'));
  console.log(colors.dim('  /kancard a6bfbcfd       # Query by session'));
  process.exit(1);
}

const query = args.join(' ');
displayCard(query);

export { displayCard };
