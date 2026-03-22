#!/usr/bin/env node
/**
 * Kanupdate skill - Update Kanban card status linked to Claude task
 */

import { moveCard, findCardByTaskId } from '../core/card';
import { getSessionId } from '../core/session';
import { KanbanStatus } from '../core/types';

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed: Record<string, string> = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const value = args[i + 1];
      parsed[key] = value;
      i++;
    } else {
      // Support positional arguments: kanupdate 3 in_progress
      if (!parsed['task-id']) {
        parsed['task-id'] = args[i];
      } else if (!parsed['status']) {
        parsed['status'] = args[i];
      }
    }
  }

  return parsed;
}

function isValidStatus(status: string): status is KanbanStatus {
  return ['pending', 'in_progress', 'completed', 'parkinglot', 'deleted'].includes(status);
}

try {
  const args = parseArgs();

  // Validate required parameters
  if (!args['task-id'] || !args['status']) {
    console.error('❌ Error: task-id and status are required');
    console.error('Usage: kanupdate --task-id "3" --status "in_progress"');
    console.error('   or: kanupdate 3 in_progress');
    process.exit(1);
  }

  const taskId = args['task-id'];
  const statusArg = args['status'];

  // Validate status
  if (!isValidStatus(statusArg)) {
    console.error(`❌ Error: Invalid status "${statusArg}"`);
    console.error('Valid statuses: pending, in_progress, completed, parkinglot, deleted');
    process.exit(1);
  }

  const newStatus = statusArg as KanbanStatus;
  const sessionId = getSessionId();
  const fullTaskId = `${sessionId}-${taskId}`;

  // Find the card
  const cardPath = findCardByTaskId(fullTaskId);

  if (!cardPath) {
    console.error(`❌ Error: Card not found for task ID ${fullTaskId}`);
    console.error(`Searched session: ${sessionId}, task: ${taskId}`);
    process.exit(1);
  }

  // Move the card to new status
  const newPath = moveCard(cardPath, newStatus);

  console.log(`✅ Updated Kanban card`);
  console.log(`   Task ID: ${fullTaskId}`);
  console.log(`   New status: ${newStatus}`);
  console.log(`   Old path: ${cardPath}`);
  console.log(`   New path: ${newPath}`);

} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error('❌ Error updating Kanban card:', message);
  process.exit(1);
}
