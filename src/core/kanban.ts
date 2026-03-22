/**
 * Kanban board operations and display
 */

import { KanbanStatus } from './types';
import { getCardsByStatus } from './card';

/**
 * Get all cards organized by status
 */
export function getKanbanBoard(): Record<KanbanStatus, Array<{ path: string; title: string; session: string; taskId?: string }>> {
  const statuses: KanbanStatus[] = ['pending', 'in_progress', 'completed', 'parkinglot', 'deleted'];
  const board: Record<KanbanStatus, Array<{ path: string; title: string; session: string; taskId?: string }>> = {
    pending: [],
    in_progress: [],
    completed: [],
    parkinglot: [],
    deleted: []
  };

  for (const status of statuses) {
    const cards = getCardsByStatus(status);
    board[status] = cards.map(({ path, card }) => ({
      path,
      title: card.subject,
      session: card.session,
      taskId: card.taskId
    }));
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
