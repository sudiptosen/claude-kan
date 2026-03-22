/**
 * Kanban board operations and display
 */

import { KanbanStatus } from './types';
import { getCardsByStatus, parseCheckboxProgress } from './card';

export interface KanbanCard {
  path: string;
  title: string;
  session: string;
  taskId?: string;
  progress?: {
    completed: number;
    total: number;
    percentage: number;
  };
}

/**
 * Get all cards organized by status
 */
export function getKanbanBoard(): Record<KanbanStatus, KanbanCard[]> {
  const statuses: KanbanStatus[] = ['pending', 'in_progress', 'completed', 'parkinglot', 'deleted'];
  const board: Record<KanbanStatus, KanbanCard[]> = {
    pending: [],
    in_progress: [],
    completed: [],
    parkinglot: [],
    deleted: []
  };

  for (const status of statuses) {
    const cards = getCardsByStatus(status);
    board[status] = cards.map(({ path, card }) => {
      const kanbanCard: KanbanCard = {
        path,
        title: card.subject,
        session: card.session,
        taskId: card.taskId
      };

      // Add checkbox progress if card has steps
      if (card.steps && card.steps.length > 0) {
        const progress = parseCheckboxProgress(card.steps);
        kanbanCard.progress = {
          completed: progress.completed,
          total: progress.total,
          percentage: progress.percentage
        };
      }

      return kanbanCard;
    });
  }

  return board;
}

/**
 * Sync the Kanban board with current state
 * This can be called manually via the /kansync skill
 */
export function syncKanban(): { synced: number; errors: string[] } {
  const errors: string[] = [];
  let synced = 0;

  try {
    // Get current board state
    const board = getKanbanBoard();

    // Count total cards
    const totalCards = Object.values(board).reduce((sum, cards) => sum + cards.length, 0);
    synced = totalCards;

    return { synced, errors };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(message);
    return { synced, errors };
  }
}
