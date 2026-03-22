#!/usr/bin/env node
/**
 * Kanboardweb (React) - Generate interactive HTML view with React + Tailwind
 * Zero dependencies - Uses CDN for React and Tailwind
 * Single HTML file - Can be opened directly in browser
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
 * Generate React-enabled HTML with Tailwind CSS
 */
function generateReactHTML(): string {
  const board = getKanbanBoard();
  const timestamp = new Date().toLocaleString();

  // Prepare board data as JSON
  const boardData = {
    pending: board.pending,
    in_progress: board.in_progress,
    completed: board.completed,
    parkinglot: board.parkinglot,
    deleted: board.deleted,
    timestamp
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kanban Board - Interactive</title>

  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            mono: ['ui-monospace', 'SFMono-Regular', 'Monaco', 'Courier', 'monospace'],
          }
        }
      }
    }
  </script>

  <!-- React and ReactDOM -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>

  <!-- Babel Standalone for JSX -->
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

  <style>
    /* Custom scrollbar */
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    ::-webkit-scrollbar-track {
      background: #f1f1f1;
    }
    ::-webkit-scrollbar-thumb {
      background: #888;
      border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #555;
    }

    /* Dark mode scrollbar */
    .dark ::-webkit-scrollbar-track {
      background: #1f2937;
    }
    .dark ::-webkit-scrollbar-thumb {
      background: #4b5563;
    }
    .dark ::-webkit-scrollbar-thumb:hover {
      background: #6b7280;
    }
  </style>
</head>
<body>
  <div id="root"></div>

  <!-- Embedded Board Data -->
  <script>
    window.KANBAN_DATA = ${JSON.stringify(boardData, null, 2)};
  </script>

  <!-- React Application -->
  <script type="text/babel">
    const { useState, useMemo, useEffect } = React;

    // Column configuration
    const COLUMNS = {
      pending: {
        id: 'pending',
        title: 'Pending',
        icon: '⏳',
        color: 'blue',
        bgLight: 'bg-blue-50',
        bgDark: 'dark:bg-blue-950',
        border: 'border-blue-300 dark:border-blue-700',
        text: 'text-blue-700 dark:text-blue-300'
      },
      in_progress: {
        id: 'in_progress',
        title: 'In Progress',
        icon: '▶️',
        color: 'yellow',
        bgLight: 'bg-yellow-50',
        bgDark: 'dark:bg-yellow-950',
        border: 'border-yellow-300 dark:border-yellow-700',
        text: 'text-yellow-700 dark:text-yellow-300'
      },
      completed: {
        id: 'completed',
        title: 'Completed',
        icon: '✅',
        color: 'green',
        bgLight: 'bg-green-50',
        bgDark: 'dark:bg-green-950',
        border: 'border-green-300 dark:border-green-700',
        text: 'text-green-700 dark:text-green-300'
      },
      parkinglot: {
        id: 'parkinglot',
        title: 'Parking Lot',
        icon: '⏸️',
        color: 'gray',
        bgLight: 'bg-gray-50',
        bgDark: 'dark:bg-gray-900',
        border: 'border-gray-300 dark:border-gray-700',
        text: 'text-gray-700 dark:text-gray-300'
      },
      deleted: {
        id: 'deleted',
        title: 'Deleted',
        icon: '🗑️',
        color: 'red',
        bgLight: 'bg-red-50',
        bgDark: 'dark:bg-red-950',
        border: 'border-red-300 dark:border-red-700',
        text: 'text-red-700 dark:text-red-300'
      }
    };

    // Card Component
    function Card({ card, onClick, columnColor }) {
      const hasProgress = card.progress && card.progress.total > 0;
      const progressPercent = hasProgress ? card.progress.percentage : 0;
      const isComplete = progressPercent === 100;

      return (
        <div
          onClick={onClick}
          className="bg-white dark:bg-gray-800 border-2 border-gray-800 dark:border-gray-600
                     p-4 mb-3 cursor-pointer transition-all duration-200 hover:shadow-lg
                     hover:-translate-y-1 group"
        >
          <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">
            {card.title}
          </h3>

          {hasProgress && (
            <div className="mb-2">
              <div className="flex justify-between text-xs mb-1">
                <span className={\`font-mono \${isComplete ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}\`}>
                  {card.progress.completed}/{card.progress.total} steps
                </span>
                <span className={\`font-mono \${isComplete ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}\`}>
                  {progressPercent}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                <div
                  className={\`h-full transition-all duration-300 \${isComplete ? 'bg-green-500' : 'bg-blue-500'}\`}
                  style={{ width: \`\${progressPercent}%\` }}
                />
              </div>
            </div>
          )}

          <div className="text-xs font-mono text-gray-600 dark:text-gray-400 space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">
                {card.session.slice(0, 8)}
              </span>
            </div>
            {card.taskId && (
              <div className="text-gray-500 dark:text-gray-500">
                Task: {card.taskId.split('-').pop()}
              </div>
            )}
          </div>
        </div>
      );
    }

    // Column Component
    function Column({ column, cards, isCollapsed, onToggleCollapse }) {
      const config = COLUMNS[column];

      return (
        <div className={\`\${config.bgLight} \${config.bgDark} border-2 \${config.border} rounded-lg overflow-hidden\`}>
          <div
            className="p-4 cursor-pointer select-none"
            onClick={onToggleCollapse}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{config.icon}</span>
                <h2 className={\`font-bold text-lg uppercase tracking-wide \${config.text}\`}>
                  {config.title}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className={\`\${config.text} font-bold font-mono text-sm px-3 py-1 bg-white dark:bg-gray-800 rounded\`}>
                  {cards.length}
                </span>
                <span className="text-xl transition-transform duration-200" style={{ transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)' }}>
                  ▶
                </span>
              </div>
            </div>
          </div>

          {!isCollapsed && (
            <div className="p-4 pt-0 max-h-[600px] overflow-y-auto">
              {cards.length === 0 ? (
                <div className="text-center py-8 text-gray-400 dark:text-gray-600 italic font-mono">
                  — no cards —
                </div>
              ) : (
                cards.map((card, idx) => (
                  <Card
                    key={\`\${column}-\${idx}\`}
                    card={card}
                    columnColor={config.color}
                    onClick={() => window.openCardModal && window.openCardModal(card, config)}
                  />
                ))
              )}
            </div>
          )}
        </div>
      );
    }

    // Modal Component
    function CardModal({ card, column, onClose }) {
      if (!card) return null;

      return (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto border-4 border-gray-900 dark:border-gray-600"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={\`p-6 border-b-2 border-gray-200 dark:border-gray-700 \${column.bgLight} \${column.bgDark}\`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-3xl">{column.icon}</span>
                    <span className={\`text-sm font-bold uppercase tracking-wide \${column.text}\`}>
                      {column.title}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {card.title}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-3xl leading-none"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {card.progress && card.progress.total > 0 && (
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">Progress</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between font-mono text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        {card.progress.completed} of {card.progress.total} steps completed
                      </span>
                      <span className={\`font-bold \${card.progress.percentage === 100 ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}\`}>
                        {card.progress.percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 h-3 rounded-full overflow-hidden">
                      <div
                        className={\`h-full transition-all \${card.progress.percentage === 100 ? 'bg-green-500' : 'bg-blue-500'}\`}
                        style={{ width: \`\${card.progress.percentage}%\` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">Details</h3>
                <div className="space-y-2 font-mono text-sm">
                  <div className="flex gap-2">
                    <span className="text-gray-600 dark:text-gray-400 min-w-[80px]">Session:</span>
                    <span className="text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                      {card.session}
                    </span>
                  </div>
                  {card.taskId && (
                    <div className="flex gap-2">
                      <span className="text-gray-600 dark:text-gray-400 min-w-[80px]">Task ID:</span>
                      <span className="text-gray-900 dark:text-gray-100">{card.taskId}</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <span className="text-gray-600 dark:text-gray-400 min-w-[80px]">Path:</span>
                    <span className="text-gray-900 dark:text-gray-100 break-all text-xs">
                      {card.path}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Main App Component
    function App() {
      const [darkMode, setDarkMode] = useState(false);
      const [searchQuery, setSearchQuery] = useState('');
      const [collapsed, setCollapsed] = useState({
        parkinglot: true,
        deleted: true
      });
      const [showParking, setShowParking] = useState(false);
      const [showDeleted, setShowDeleted] = useState(false);
      const [selectedCard, setSelectedCard] = useState(null);
      const [selectedColumn, setSelectedColumn] = useState(null);

      // Apply dark mode to document
      useEffect(() => {
        if (darkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }, [darkMode]);

      // Make modal function globally available
      useEffect(() => {
        window.openCardModal = (card, column) => {
          setSelectedCard(card);
          setSelectedColumn(column);
        };
      }, []);

      // Filter cards based on search query
      const filterCards = (cards) => {
        if (!searchQuery.trim()) return cards;
        const query = searchQuery.toLowerCase();
        return cards.filter(card =>
          card.title.toLowerCase().includes(query) ||
          card.session.toLowerCase().includes(query) ||
          (card.taskId && card.taskId.toLowerCase().includes(query))
        );
      };

      const data = window.KANBAN_DATA;

      // Calculate totals
      const totals = useMemo(() => {
        const pending = data.pending.length;
        const inProgress = data.in_progress.length;
        const completed = data.completed.length;
        const parkinglot = data.parkinglot.length;
        const deleted = data.deleted.length;
        const total = pending + inProgress + completed + parkinglot + deleted;

        return { pending, inProgress, completed, parkinglot, deleted, total };
      }, [data]);

      // Determine which columns to show
      const visibleColumns = ['pending', 'in_progress', 'completed'];
      if (showParking) visibleColumns.push('parkinglot');
      if (showDeleted) visibleColumns.push('deleted');

      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 border-b-4 border-gray-900 dark:border-gray-600 sticky top-0 z-40 shadow-lg">
            <div className="container mx-auto px-4 py-6">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-4xl font-bold font-mono text-gray-900 dark:text-gray-100">
                  📋 KANBAN
                </h1>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title="Toggle dark mode"
                >
                  <span className="text-2xl">{darkMode ? '☀️' : '🌙'}</span>
                </button>
              </div>

              {/* Search and filters */}
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="🔍 Search cards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                           focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 font-mono"
                />

                <div className="flex flex-wrap gap-4 items-center">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showParking}
                      onChange={(e) => setShowParking(e.target.checked)}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                      Show Parking Lot ({totals.parkinglot})
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showDeleted}
                      onChange={(e) => setShowDeleted(e.target.checked)}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                      Show Deleted ({totals.deleted})
                    </span>
                  </label>

                  <div className="ml-auto flex gap-4 flex-wrap text-sm font-mono">
                    <span className="text-gray-700 dark:text-gray-300">
                      <strong>Pending:</strong> {totals.pending}
                    </span>
                    <span className="text-gray-700 dark:text-gray-300">
                      <strong>In Progress:</strong> {totals.inProgress}
                    </span>
                    <span className="text-gray-700 dark:text-gray-300">
                      <strong>Completed:</strong> {totals.completed}
                    </span>
                    <span className="text-gray-700 dark:text-gray-300 font-bold">
                      Total: {totals.total}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Board */}
          <div className="container mx-auto px-4 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {visibleColumns.map(column => (
                <Column
                  key={column}
                  column={column}
                  cards={filterCards(data[column])}
                  isCollapsed={collapsed[column] || false}
                  onToggleCollapse={() => setCollapsed(prev => ({ ...prev, [column]: !prev[column] }))}
                />
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="container mx-auto px-4 py-8">
            <div className="text-center text-sm font-mono text-gray-500 dark:text-gray-400 space-y-2">
              <div>Generated: {data.timestamp}</div>
              <div>Run <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">/kanboardweb</code> to refresh</div>
              <div className="text-xs">
                Powered by React + Tailwind CSS (zero dependencies)
              </div>
            </div>
          </div>

          {/* Modal */}
          {selectedCard && selectedColumn && (
            <CardModal
              card={selectedCard}
              column={selectedColumn}
              onClose={() => {
                setSelectedCard(null);
                setSelectedColumn(null);
              }}
            />
          )}
        </div>
      );
    }

    // Render the app
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<App />);
  </script>
</body>
</html>`;
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
 * Generate and open React-enabled HTML kanban board
 */
function generateWebBoard() {
  try {
    console.log(colors.bold(colors.cyan('\n🌐 Generating Interactive Kanban Board (React + Tailwind)...\n')));

    // Generate HTML
    const html = generateReactHTML();

    // Write to file
    const outputDir = path.join('.kanhelper');
    const outputPath = path.join(outputDir, 'kanboard-react.html');

    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(outputPath, html);

    const absolutePath = path.resolve(outputPath);

    console.log(colors.green('✅ Interactive HTML generated successfully!'));
    console.log(colors.dim(`   File: ${outputPath}`));
    console.log(colors.dim(`   Size: ${Math.round(html.length / 1024)}KB`));
    console.log('');
    console.log(colors.bold('✨ Features:'));
    console.log(colors.dim('   • React-powered interactivity'));
    console.log(colors.dim('   • Tailwind CSS styling'));
    console.log(colors.dim('   • Dark mode toggle'));
    console.log(colors.dim('   • Search & filter'));
    console.log(colors.dim('   • Collapsible columns'));
    console.log(colors.dim('   • Progress indicators'));
    console.log(colors.dim('   • Click cards for details'));
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
