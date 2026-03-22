#!/usr/bin/env node
/**
 * Kanprune skill - Permanently delete all cards in deleted status
 * ⚠️ DESTRUCTIVE OPERATION - Requires explicit confirmation
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { getCardsByStatus } from '../core/card';

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

/**
 * Ask for user confirmation
 */
function askConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      const normalized = answer.trim().toLowerCase();
      resolve(normalized === 'yes' || normalized === 'y');
    });
  });
}

/**
 * Permanently delete all cards in deleted status
 */
async function pruneDeletedCards(force: boolean = false) {
  try {
    // Get all deleted cards
    const deletedCards = getCardsByStatus('deleted');

    if (deletedCards.length === 0) {
      console.log(colors.green('✅ No deleted cards to prune'));
      console.log(colors.dim('   All clean!'));
      return;
    }

    // Display warning header
    console.log(colors.bold(colors.red('\n⚠️  DESTRUCTIVE OPERATION WARNING ⚠️')));
    console.log(colors.dim('═'.repeat(50)));
    console.log('');

    // List all cards that will be deleted
    console.log(colors.bold('The following cards will be PERMANENTLY DELETED:\n'));

    deletedCards.forEach((item, idx) => {
      const { card, path: cardPath } = item;
      console.log(colors.yellow(`${idx + 1}. ${card.subject}`));
      console.log(colors.dim(`   Session: ${card.session.slice(0, 8)}...`));
      console.log(colors.dim(`   Created: ${new Date(card.created).toLocaleDateString()}`));
      console.log(colors.dim(`   Path: ${cardPath}`));
      console.log('');
    });

    console.log(colors.bold(colors.red(`Total: ${deletedCards.length} card${deletedCards.length !== 1 ? 's' : ''} will be permanently deleted`)));
    console.log(colors.dim('This action CANNOT be undone!\n'));

    // Ask for confirmation (unless --force flag is used)
    if (!force) {
      const confirmed = await askConfirmation(
        colors.bold('Type "yes" to confirm deletion (or anything else to cancel): ')
      );

      if (!confirmed) {
        console.log(colors.yellow('\n❌ Pruning cancelled'));
        console.log(colors.dim('   No files were deleted'));
        process.exit(0);
      }
    } else {
      console.log(colors.yellow('⚡ --force flag detected, skipping confirmation\n'));
    }

    // Perform deletion
    console.log(colors.bold('\n🗑️  Deleting cards...\n'));

    let deleted = 0;
    const errors: string[] = [];

    for (const { card, path: cardPath } of deletedCards) {
      try {
        // Delete the card file
        fs.unlinkSync(cardPath);
        console.log(colors.green(`✅ Deleted: ${card.subject}`));
        deleted++;

        // Clean up empty directories
        const sessionDir = path.dirname(cardPath);
        const sessionFiles = fs.readdirSync(sessionDir);

        if (sessionFiles.length === 0) {
          fs.rmdirSync(sessionDir);
          console.log(colors.dim(`   Removed empty session directory`));
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push(`${card.subject}: ${message}`);
        console.log(colors.red(`❌ Failed: ${card.subject}`));
        console.log(colors.dim(`   Error: ${message}`));
      }
    }

    // Summary
    console.log('');
    console.log(colors.dim('═'.repeat(50)));
    console.log(colors.bold(colors.cyan('\n📊 Pruning Summary:\n')));
    console.log(colors.green(`✅ Successfully deleted: ${deleted} card${deleted !== 1 ? 's' : ''}`));

    if (errors.length > 0) {
      console.log(colors.red(`❌ Failed: ${errors.length} card${errors.length !== 1 ? 's' : ''}`));
      console.log('');
      errors.forEach(err => console.log(colors.dim(`   - ${err}`)));
    }

    console.log('');

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(colors.red('Error during pruning:'), message);
    process.exit(1);
  }
}

// Parse arguments
const args = process.argv.slice(2);
const forceFlag = args.includes('--force');

// Run pruning
pruneDeletedCards(forceFlag);

export { pruneDeletedCards };
