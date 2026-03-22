#!/usr/bin/env node
/**
 * Kanboardfull skill - Display full Kanban board with all columns
 */

import { getKanbanBoard } from '../core/kanban';

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

function displayKanbanFull() {
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

    // Header with full metrics
    console.log(colors.bold(colors.cyan('┌─ KANBAN BOARD [FULL VIEW]')));
    console.log(
      colors.dim('├─ ') +
      colors.yellow(`PENDING: ${counts.pending}`) + colors.dim(' │ ') +
      colors.blue(`IN PROGRESS: ${counts.in_progress}`) + colors.dim(' │ ') +
      colors.green(`COMPLETED: ${counts.completed}`) + colors.dim(' │ ') +
      colors.gray(`PARKING LOT: ${counts.parkinglot}`) + colors.dim(' │ ') +
      colors.red(`DELETED: ${counts.deleted}`)
    );
    console.log(colors.dim('├─ ') + colors.bold(`Total Cards: ${total}`));
    console.log(colors.dim('│'));

    // Always show all columns
    const allColumns = [
      {
        name: 'PENDING',
        symbol: '⏳',
        color: colors.yellow,
        cards: board.pending
      },
      {
        name: 'IN PROGRESS',
        symbol: '▶',
        color: colors.blue,
        cards: board.in_progress
      },
      {
        name: 'COMPLETED',
        symbol: '✓',
        color: colors.green,
        cards: board.completed
      },
      {
        name: 'PARKING LOT',
        symbol: '◼',
        color: colors.gray,
        cards: board.parkinglot
      },
      {
        name: 'DELETED',
        symbol: '✗',
        color: colors.red,
        cards: board.deleted
      }
    ];

    // Display each column
    allColumns.forEach((col, idx) => {
      const isLast = idx === allColumns.length - 1;
      const prefix = isLast ? '└─' : '├─';

      console.log(
        colors.dim(prefix) + ' ' +
        col.color(colors.bold(col.name)) +
        colors.dim(` [${col.cards.length} card${col.cards.length !== 1 ? 's' : ''}]`)
      );

      if (col.cards.length === 0) {
        // Show empty indicator
        const emptyPrefix = isLast ? '   ' : '│  ';
        console.log(colors.dim(emptyPrefix + '   No cards in this column'));
      } else {
        col.cards.forEach((card, cardIdx) => {
          const isLastCard = cardIdx === col.cards.length - 1;
          const cardPrefix = isLast
            ? (isLastCard ? '   └─' : '   ├─')
            : (isLastCard ? '│  └─' : '│  ├─');

          // Show full card title with progress
          let titleDisplay = colors.bold(card.title);
          if (card.progress && card.progress.total > 0) {
            const { completed, total, percentage } = card.progress;
            const progressColor = percentage === 100 ? colors.green : colors.cyan;
            titleDisplay += ' ' + progressColor(`[${completed}/${total} - ${percentage}%]`);
          }
          console.log(colors.dim(cardPrefix) + ' ' + titleDisplay);

          // Show session details on next line
          const sessionPrefix = isLast
            ? (isLastCard ? '      ' : '   │  ')
            : (isLastCard ? '│     ' : '│  │  ');
          console.log(colors.dim(sessionPrefix + `Session: ${card.session}`));
        });
      }
    });

    // Examples footer (only if there are cards)
    if (total > 0) {
      console.log('');
      console.log(colors.dim('═══════════════════════════════════════════════════════'));
      console.log(colors.bold(colors.cyan('💡 Query Individual Cards:')));
      console.log('');
      console.log(colors.dim('  Use /kancard to view detailed card information:'));
      console.log('');

      // Show examples based on available cards
      const exampleCard = board.pending[0] || board.in_progress[0] || board.completed[0] || board.parkinglot[0] || board.deleted[0];

      if (exampleCard) {
        const shortSession = exampleCard.session.slice(0, 8);
        const titleWords = exampleCard.title.split(' ').slice(0, 2).join(' ');

        console.log(colors.yellow('  By title:') + colors.dim(`    /kancard "${titleWords}"`));
        console.log(colors.yellow('  By session:') + colors.dim(`  /kancard ${shortSession}`));

        if (exampleCard.taskId) {
          const taskNum = exampleCard.taskId.split('-').pop();
          console.log(colors.yellow('  By task ID:') + colors.dim(`   /kancard ${taskNum}`));
        }
      }

      console.log('');
    }

    console.log(''); // Final newline

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error displaying Kanban board:', message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  displayKanbanFull();
}

export { displayKanbanFull };
