#!/usr/bin/env node
/**
 * Kanboard skill - Display text-based Kanban board
 * Compact, information-dense design
 */

import { getKanbanBoard } from '../core/kanban';

// ANSI styling - extended palette
const colors = {
  yellow: (text: string) => `\x1b[33m${text}\x1b[0m`,
  blue: (text: string) => `\x1b[34m${text}\x1b[0m`,
  green: (text: string) => `\x1b[32m${text}\x1b[0m`,
  gray: (text: string) => `\x1b[90m${text}\x1b[0m`,
  cyan: (text: string) => `\x1b[36m${text}\x1b[0m`,
  magenta: (text: string) => `\x1b[35m${text}\x1b[0m`,
  red: (text: string) => `\x1b[31m${text}\x1b[0m`,
  bold: (text: string) => `\x1b[1m${text}\x1b[0m`,
  dim: (text: string) => `\x1b[2m${text}\x1b[0m`,
  inverse: (text: string) => `\x1b[7m${text}\x1b[0m`
};

function displayKanban() {
  try {
    const board = getKanbanBoard();

    // Count cards
    const counts = {
      pending: board.pending.length,
      in_progress: board.in_progress.length,
      completed: board.completed.length,
      parkinglot: board.parkinglot.length,
      deleted: board.deleted.length
    };
    const total = Object.values(counts).reduce((a, b) => a + b, 0);

    // Header with counts - single line
    console.log(
      colors.bold(colors.cyan('┌─ KANBAN ')) +
      colors.dim('│ ') +
      colors.yellow(`⏳${counts.pending}`) + colors.dim(' │ ') +
      colors.blue(`▶${counts.in_progress}`) + colors.dim(' │ ') +
      colors.green(`✓${counts.completed}`) + colors.dim(' │ ') +
      colors.gray(`◼${counts.parkinglot}`) + colors.dim(' │ ') +
      colors.red(`✗${counts.deleted}`) + colors.dim(' │ ') +
      colors.dim(`Σ${total}`)
    );

    // Only show columns that have cards
    const activeColumns: Array<{ name: string; symbol: string; color: (t: string) => string; cards: any[] }> = [];

    if (counts.pending > 0) {
      activeColumns.push({
        name: 'PENDING',
        symbol: '⏳',
        color: colors.yellow,
        cards: board.pending
      });
    }
    if (counts.in_progress > 0) {
      activeColumns.push({
        name: 'IN PROGRESS',
        symbol: '▶',
        color: colors.blue,
        cards: board.in_progress
      });
    }
    if (counts.completed > 0) {
      activeColumns.push({
        name: 'COMPLETED',
        symbol: '✓',
        color: colors.green,
        cards: board.completed
      });
    }
    if (counts.parkinglot > 0) {
      activeColumns.push({
        name: 'PARKING LOT',
        symbol: '◼',
        color: colors.gray,
        cards: board.parkinglot
      });
    }
    if (counts.deleted > 0) {
      activeColumns.push({
        name: 'DELETED',
        symbol: '✗',
        color: colors.red,
        cards: board.deleted
      });
    }

    if (total === 0) {
      console.log(colors.dim('└─ No cards yet. Use /kancreate to add tasks.\n'));
      return;
    }

    // Display each active column compactly
    activeColumns.forEach((col, idx) => {
      const isLast = idx === activeColumns.length - 1;
      const prefix = isLast ? '└─' : '├─';

      console.log(
        colors.dim(prefix) + ' ' +
        col.color(colors.bold(col.symbol + ' ' + col.name)) +
        colors.dim(` (${col.cards.length})`)
      );

      col.cards.forEach((card, cardIdx) => {
        const isLastCard = cardIdx === col.cards.length - 1;
        const cardPrefix = isLast
          ? (isLastCard ? '   └─' : '   ├─')
          : (isLastCard ? '│  └─' : '│  ├─');

        const sessionTag = colors.dim(`[${card.session.slice(0, 8)}]`);

        // Add progress indicator if card has steps
        let progressTag = '';
        if (card.progress && card.progress.total > 0) {
          const { completed, total, percentage } = card.progress;
          const progressColor = percentage === 100 ? colors.green : colors.cyan;
          progressTag = ' ' + progressColor(`[${completed}/${total}]`);
        }

        console.log(colors.dim(cardPrefix) + ' ' + card.title + progressTag + ' ' + sessionTag);
      });
    });

    console.log(''); // Final newline

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error displaying Kanban board:', message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  displayKanban();
}

export { displayKanban };
