#!/usr/bin/env node
/**
 * Kanupdate skill - Update Kanban card status and checkboxes linked to Claude task
 *
 * Natural language syntax:
 * - kanupdate 3 in_progress          (update status)
 * - kanupdate 3 check step 1         (mark step 1 as complete)
 * - kanupdate 3 uncheck step 0       (mark step 0 as incomplete)
 * - kanupdate 3 toggle step 2        (toggle step 2 completion)
 * - kanupdate 3 regenerate steps     (regenerate task list)
 */

import {
  moveCard,
  findCardByTaskId,
  updateCheckbox,
  regenerateSteps,
  parseCheckboxProgress
} from '../core/card';
import { getSessionId } from '../core/session';
import { KanbanStatus } from '../core/types';

interface ParsedCommand {
  taskId: string;
  action: 'status' | 'check' | 'uncheck' | 'toggle' | 'regenerate';
  status?: KanbanStatus;
  stepIndex?: number;
}

function parseArgs(): ParsedCommand {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    throw new Error('No arguments provided');
  }

  // First arg is always task-id
  const taskId = args[0].startsWith('--') ? args[1] : args[0];

  // Simple two-argument case: kanupdate 3 in_progress
  if (args.length === 2 && isValidStatus(args[1])) {
    return {
      taskId,
      action: 'status',
      status: args[1] as KanbanStatus
    };
  }

  // Check for natural language commands
  // Format: kanupdate 3 check step 1
  if (args.length >= 3) {
    const command = args[1].toLowerCase();

    // Check/uncheck/toggle step commands
    if (['check', 'uncheck', 'toggle'].includes(command)) {
      if (args[2].toLowerCase() === 'step' && args[3] !== undefined) {
        const stepIndex = parseInt(args[3], 10);
        if (isNaN(stepIndex)) {
          throw new Error(`Invalid step index: ${args[3]}`);
        }
        return {
          taskId,
          action: command as 'check' | 'uncheck' | 'toggle',
          stepIndex
        };
      }
    }

    // Regenerate steps command
    if (command === 'regenerate' && args[2].toLowerCase() === 'steps') {
      return {
        taskId,
        action: 'regenerate'
      };
    }

    // Status update with more args
    if (isValidStatus(args[1])) {
      return {
        taskId,
        action: 'status',
        status: args[1] as KanbanStatus
      };
    }
  }

  // Fallback: check for --task-id and --status flags
  const parsed: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const value = args[i + 1];
      parsed[key] = value;
      i++;
    }
  }

  if (parsed['status'] && isValidStatus(parsed['status'])) {
    return {
      taskId: parsed['task-id'] || taskId,
      action: 'status',
      status: parsed['status'] as KanbanStatus
    };
  }

  throw new Error('Invalid command format. See usage examples.');
}

function isValidStatus(status: string): status is KanbanStatus {
  return ['pending', 'in_progress', 'completed', 'parkinglot', 'deleted'].includes(status);
}

try {
  const command = parseArgs();
  const sessionId = getSessionId();
  const fullTaskId = `${sessionId}-${command.taskId}`;

  // Find the card
  const cardPath = findCardByTaskId(fullTaskId);

  if (!cardPath) {
    console.error(`❌ Error: Card not found for task ID ${fullTaskId}`);
    console.error(`Searched session: ${sessionId}, task: ${command.taskId}`);
    process.exit(1);
  }

  // Execute the appropriate action
  switch (command.action) {
    case 'status':
      if (!command.status) {
        throw new Error('Status is required for status update');
      }
      const newPath = moveCard(cardPath, command.status);
      console.log(`✅ Updated card status`);
      console.log(`   Task ID: ${fullTaskId}`);
      console.log(`   New status: ${command.status}`);
      console.log(`   Path: ${newPath}`);
      break;

    case 'check':
      if (command.stepIndex === undefined) {
        throw new Error('Step index is required');
      }
      updateCheckbox(cardPath, command.stepIndex, true);
      console.log(`✅ Checked step ${command.stepIndex}`);
      console.log(`   Task ID: ${fullTaskId}`);
      console.log(`   Card: ${cardPath}`);
      break;

    case 'uncheck':
      if (command.stepIndex === undefined) {
        throw new Error('Step index is required');
      }
      updateCheckbox(cardPath, command.stepIndex, false);
      console.log(`✅ Unchecked step ${command.stepIndex}`);
      console.log(`   Task ID: ${fullTaskId}`);
      console.log(`   Card: ${cardPath}`);
      break;

    case 'toggle':
      if (command.stepIndex === undefined) {
        throw new Error('Step index is required');
      }
      updateCheckbox(cardPath, command.stepIndex);
      console.log(`✅ Toggled step ${command.stepIndex}`);
      console.log(`   Task ID: ${fullTaskId}`);
      console.log(`   Card: ${cardPath}`);
      break;

    case 'regenerate':
      regenerateSteps(cardPath);
      console.log(`✅ Regenerated steps (preserved checked items)`);
      console.log(`   Task ID: ${fullTaskId}`);
      console.log(`   Card: ${cardPath}`);
      break;

    default:
      throw new Error(`Unknown action: ${command.action}`);
  }

} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error('❌ Error updating Kanban card:', message);
  console.error('');
  console.error('Usage:');
  console.error('  kanupdate 3 in_progress           - Update card status');
  console.error('  kanupdate 3 check step 1          - Mark step 1 as complete');
  console.error('  kanupdate 3 uncheck step 0        - Mark step 0 as incomplete');
  console.error('  kanupdate 3 toggle step 2         - Toggle step 2 completion');
  console.error('  kanupdate 3 regenerate steps      - Regenerate task list');
  process.exit(1);
}
