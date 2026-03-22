#!/usr/bin/env node
/**
 * Kancreate skill - Create Kanban card linked to Claude task
 */

import { createCard } from '../core/card';
import { getSessionId } from '../core/session';
import { KanbanStatus } from '../core/types';

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed: Record<string, string | string[]> = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);

      // Handle --steps which can be repeated multiple times
      if (key === 'steps') {
        const stepsArray: string[] = [];
        i++; // Move to next arg
        while (i < args.length && !args[i].startsWith('--')) {
          stepsArray.push(args[i]);
          i++;
        }
        i--; // Back up one since loop will increment
        parsed[key] = stepsArray;
      } else {
        const value = args[i + 1];
        parsed[key] = value;
        i++;
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
  if (!args['task-id'] || !args['subject']) {
    console.error('❌ Error: --task-id and --subject are required');
    console.error('Usage: kancreate --task-id "3" --subject "Task title" [--description "..."] [--status "pending"] [--card-name "custom-name"] [--steps "step1" "step2" ...]');
    process.exit(1);
  }

  const taskId = args['task-id'] as string;
  const subject = args['subject'] as string;
  const description = (args['description'] as string) || '';
  const statusArg = (args['status'] as string) || 'pending';
  const cardName = args['card-name'] as string | undefined;
  const customSteps = args['steps'] as string[] | undefined;

  // Validate status
  if (!isValidStatus(statusArg)) {
    console.error(`❌ Error: Invalid status "${statusArg}"`);
    console.error('Valid statuses: pending, in_progress, completed, parkinglot, deleted');
    process.exit(1);
  }

  const status = statusArg as KanbanStatus;
  const sessionId = getSessionId();
  const fullTaskId = `${sessionId}-${taskId}`;

  // Process custom steps to ensure checkbox format
  let steps: string[] | undefined;
  if (customSteps && customSteps.length > 0) {
    steps = customSteps.map(step => {
      // If step doesn't start with checkbox format, add it
      if (!step.match(/^- \[([ xX])\]/)) {
        return `- [ ] ${step}`;
      }
      return step;
    });
  }

  // Create the card
  const cardPath = createCard(subject, description, status, fullTaskId, cardName, steps);

  console.log(`✅ Created Kanban card`);
  console.log(`   Path: ${cardPath}`);
  console.log(`   Task ID: ${fullTaskId}`);
  console.log(`   Status: ${status}`);
  console.log(`   Subject: ${subject}`);
  if (steps) {
    console.log(`   Steps: ${steps.length} custom steps added`);
  } else {
    console.log(`   Steps: Auto-generated from description`);
  }

} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error('❌ Error creating Kanban card:', message);
  process.exit(1);
}
