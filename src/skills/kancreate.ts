#!/usr/bin/env node
/**
 * Kancreate skill - Create Kanban card linked to Claude task
 */

import { createCard } from '../core/card';
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
  if (!args['task-id'] || !args['subject']) {
    console.error('❌ Error: --task-id and --subject are required');
    console.error('Usage: kancreate --task-id "3" --subject "Task title" [--description "..."] [--status "pending"] [--card-name "custom-name"]');
    process.exit(1);
  }

  const taskId = args['task-id'];
  const subject = args['subject'];
  const description = args['description'] || '';
  const statusArg = args['status'] || 'pending';
  const cardName = args['card-name'];

  // Validate status
  if (!isValidStatus(statusArg)) {
    console.error(`❌ Error: Invalid status "${statusArg}"`);
    console.error('Valid statuses: pending, in_progress, completed, parkinglot, deleted');
    process.exit(1);
  }

  const status = statusArg as KanbanStatus;
  const sessionId = getSessionId();
  const fullTaskId = `${sessionId}-${taskId}`;

  // Create the card
  const cardPath = createCard(subject, description, status, fullTaskId, cardName);

  console.log(`✅ Created Kanban card`);
  console.log(`   Path: ${cardPath}`);
  console.log(`   Task ID: ${fullTaskId}`);
  console.log(`   Status: ${status}`);
  console.log(`   Subject: ${subject}`);

} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error('❌ Error creating Kanban card:', message);
  process.exit(1);
}
