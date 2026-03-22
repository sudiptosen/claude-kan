#!/usr/bin/env node
/**
 * Kanboardweb skill - Generate and open HTML view of Kanban board
 * Works standalone - no server required
 */

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { getKanbanBoard } from '../core/kanban';

// ANSI styling
const colors = {
  cyan: (text: string) => `\x1b[36m${text}\x1b[0m`,
  green: (text: string) => `\x1b[32m${text}\x1b[0m`,
  dim: (text: string) => `\x1b[2m${text}\x1b[0m`,
  bold: (text: string) => `\x1b[1m${text}\x1b[0m`
};

/**
 * Generate complete HTML with embedded CSS and data
 */
function generateHTML(): string {
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

  // Prepare columns data
  const columns = [
    {
      id: 'pending',
      name: 'PENDING',
      icon: '[ ]',
      color: '#2B4C7E',
      borderColor: '#567EBB',
      cards: board.pending,
      hidden: false
    },
    {
      id: 'in_progress',
      name: 'IN PROGRESS',
      icon: '[▶]',
      color: '#D97706',
      borderColor: '#F59E0B',
      cards: board.in_progress,
      hidden: false
    },
    {
      id: 'completed',
      name: 'COMPLETED',
      icon: '[✓]',
      color: '#047857',
      borderColor: '#10B981',
      cards: board.completed,
      hidden: false
    },
    {
      id: 'parkinglot',
      name: 'PARKING LOT',
      icon: '[◼]',
      color: '#6B7280',
      borderColor: '#9CA3AF',
      cards: board.parkinglot,
      hidden: true
    },
    {
      id: 'deleted',
      name: 'DELETED',
      icon: '[✗]',
      color: '#B91C1C',
      borderColor: '#EF4444',
      cards: board.deleted,
      hidden: true
    }
  ];

  const timestamp = new Date().toLocaleString();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kanban Board</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&family=Special+Elite&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Courier Prime', 'Courier New', monospace;
      background: #F5F5F0;
      min-height: 100vh;
      padding: 40px 20px;
      color: #1a1a1a;
    }

    .container {
      max-width: 1600px;
      margin: 0 auto;
    }

    .header {
      margin-bottom: 32px;
      border-bottom: 3px solid #1a1a1a;
      padding-bottom: 20px;
    }

    .header h1 {
      font-family: 'Special Elite', 'Courier Prime', monospace;
      font-size: 36px;
      color: #1a1a1a;
      letter-spacing: 2px;
      margin-bottom: 16px;
      text-transform: uppercase;
    }

    .controls {
      display: flex;
      gap: 24px;
      margin-top: 16px;
      flex-wrap: wrap;
    }

    .checkbox-group {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      cursor: pointer;
      user-select: none;
    }

    .checkbox-group input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
      border: 2px solid #1a1a1a;
    }

    .stats {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
      margin-top: 16px;
      font-size: 13px;
      letter-spacing: 0.5px;
    }

    .stat {
      padding: 0;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .stat-label {
      font-weight: 700;
    }

    .board {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
      margin-bottom: 40px;
    }

    .column {
      border: 3px solid;
      padding: 20px;
      min-height: 250px;
      transition: opacity 0.3s ease;
    }

    .column.hidden {
      display: none;
    }

    .column-pending {
      border-color: #567EBB;
      background: #EBF3FF;
    }

    .column-in_progress {
      border-color: #F59E0B;
      background: #FFF7ED;
    }

    .column-completed {
      border-color: #10B981;
      background: #ECFDF5;
    }

    .column-parkinglot {
      border-color: #9CA3AF;
      background: #F9FAFB;
    }

    .column-deleted {
      border-color: #EF4444;
      background: #FEF2F2;
    }

    .column-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 2px dashed #1a1a1a;
    }

    .column-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 16px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      font-family: 'Special Elite', monospace;
    }

    .column-count {
      background: #1a1a1a;
      color: #F5F5F0;
      padding: 4px 12px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1px;
    }

    .card {
      background: #FFFFFF;
      border: 2px solid #1a1a1a;
      padding: 16px;
      margin-bottom: 12px;
      cursor: pointer;
      transition: all 0.15s ease;
      box-shadow: 3px 3px 0 rgba(0,0,0,0.1);
    }

    .card:hover {
      transform: translate(-2px, -2px);
      box-shadow: 5px 5px 0 rgba(0,0,0,0.2);
    }

    .card-title {
      font-size: 15px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 10px;
      line-height: 1.4;
      letter-spacing: 0.3px;
    }

    .card-meta {
      font-size: 12px;
      color: #666;
      display: flex;
      flex-direction: column;
      gap: 4px;
      letter-spacing: 0.5px;
    }

    .card-session {
      background: #E5E5E0;
      padding: 3px 8px;
      display: inline-block;
      border: 1px solid #1a1a1a;
    }

    .empty-state {
      text-align: center;
      padding: 40px 16px;
      color: #999;
      font-size: 14px;
      font-style: italic;
      letter-spacing: 0.5px;
    }

    .footer {
      border-top: 3px solid #1a1a1a;
      padding-top: 20px;
      text-align: center;
      font-size: 12px;
      color: #666;
      letter-spacing: 0.5px;
    }

    .refresh-notice {
      margin-top: 8px;
      font-style: italic;
    }

    @media (max-width: 768px) {
      body {
        padding: 20px 12px;
      }

      .header h1 {
        font-size: 24px;
      }

      .board {
        grid-template-columns: 1fr;
      }

      .controls {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>K_BOARD</h1>

      <div class="controls">
        <label class="checkbox-group">
          <input type="checkbox" id="toggle-parkinglot" onchange="toggleColumn('parkinglot')">
          <span>SHOW PARKING LOT</span>
        </label>
        <label class="checkbox-group">
          <input type="checkbox" id="toggle-deleted" onchange="toggleColumn('deleted')">
          <span>SHOW DELETED</span>
        </label>
      </div>

      <div class="stats">
        ${columns.map(col => `
          <div class="stat" style="color: ${col.color};">
            <span class="stat-label">${col.icon} ${col.name}:</span>
            <span>${col.cards.length}</span>
          </div>
        `).join('')}
        <div class="stat" style="color: #1a1a1a;">
          <span class="stat-label">TOTAL:</span>
          <span>${total}</span>
        </div>
      </div>
    </div>

    <div class="board">
      ${columns.map(col => `
        <div class="column column-${col.id} ${col.hidden ? 'hidden' : ''}" id="column-${col.id}">
          <div class="column-header">
            <div class="column-title" style="color: ${col.color};">
              <span>${col.icon}</span>
              <span>${col.name}</span>
            </div>
            <div class="column-count">${col.cards.length}</div>
          </div>

          ${col.cards.length === 0 ? `
            <div class="empty-state">
              -- no cards --
            </div>
          ` : col.cards.map(card => `
            <div class="card">
              <div class="card-title">${escapeHtml(card.title)}</div>
              <div class="card-meta">
                <span>session: <span class="card-session">${card.session.slice(0, 8)}</span></span>
                ${card.taskId ? `<span>task_id: ${card.taskId.split('-').pop()}</span>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      `).join('')}
    </div>

    <div class="footer">
      <div>Generated: ${timestamp}</div>
      <div class="refresh-notice">Run <code>/kanboardweb</code> again to refresh</div>
    </div>
  </div>

  <script>
    // Toggle column visibility
    function toggleColumn(columnId) {
      const column = document.getElementById('column-' + columnId);
      const checkbox = document.getElementById('toggle-' + columnId);
      if (column && checkbox) {
        if (checkbox.checked) {
          column.classList.remove('hidden');
        } else {
          column.classList.add('hidden');
        }
      }
    }

    // Add click handlers for cards
    document.querySelectorAll('.card').forEach(card => {
      card.addEventListener('click', function() {
        this.style.background = '#FFFFCC';
        setTimeout(() => {
          this.style.background = '#FFFFFF';
        }, 200);
      });
    });
  </script>
</body>
</html>`;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Open file in default browser (cross-platform)
 */
function openInBrowser(filePath: string) {
  const platform = process.platform;
  let command: string;

  if (platform === 'darwin') {
    command = `open "${filePath}"`;
  } else if (platform === 'win32') {
    command = `start "" "${filePath}"`;
  } else {
    // Linux and others
    command = `xdg-open "${filePath}"`;
  }

  exec(command, (error) => {
    if (error) {
      console.error('Could not open browser automatically.');
      console.log(`Please open manually: ${filePath}`);
    }
  });
}

/**
 * Generate and open HTML kanban board
 */
function generateWebBoard() {
  try {
    console.log(colors.bold(colors.cyan('\n🌐 Generating Kanban Board HTML...\n')));

    // Generate HTML
    const html = generateHTML();

    // Write to file
    const outputDir = path.join('.kanhelper');
    const outputPath = path.join(outputDir, 'kb.html');

    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(outputPath, html);

    const absolutePath = path.resolve(outputPath);

    console.log(colors.green('✅ HTML generated successfully!'));
    console.log(colors.dim(`   File: ${outputPath}`));
    console.log('');
    console.log(colors.bold('🚀 Opening in browser...'));
    console.log('');

    // Open in browser
    openInBrowser(absolutePath);

    console.log(colors.dim('💡 Tip: Run /kanboardweb again to refresh the view'));
    console.log('');

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error generating web board:', message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  generateWebBoard();
}

export { generateWebBoard };
