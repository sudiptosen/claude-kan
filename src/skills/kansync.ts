#!/usr/bin/env node
/**
 * Kansync skill - Manually sync task state with Kanban board
 */

import { syncKanban } from '../core/kanban';
import { getSessionInfo } from '../core/session';

function syncCommand() {
  try {
    console.log('\n🔄 Syncing Kanban board...\n');

    // Get session info
    const sessionInfo = getSessionInfo();
    if (sessionInfo) {
      console.log(`Current session: ${sessionInfo.currentSession.slice(0, 8)}`);
      if (sessionInfo.lastSession) {
        console.log(`Last session: ${sessionInfo.lastSession.slice(0, 8)}`);
      }
      console.log(`Last updated: ${new Date(sessionInfo.updatedAt).toLocaleString()}\n`);
    }

    // Sync the board
    const result = syncKanban();

    if (result.errors.length > 0) {
      console.log('⚠️  Sync completed with errors:\n');
      result.errors.forEach(error => console.log(`  - ${error}`));
      console.log('');
    }

    console.log(`✅ Sync complete! ${result.synced} cards found.\n`);

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error syncing Kanban board:', message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  syncCommand();
}

export { syncCommand };
