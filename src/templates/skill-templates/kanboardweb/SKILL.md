---
name: kanboardweb
description: Generate and open HTML view of Kanban board
---

# Kanboardweb Skill

Generates a beautiful standalone HTML view of your Kanban board and opens it in your default browser.

## Command

`node .kanhelper/dist/skills/kanboardweb.js`

## Usage

```bash
/kanboardweb
```

Generates `.kanhelper/kanban-board.html` and opens it automatically in your browser.

## Features

### ✨ **Standalone & Portable**
- Single HTML file with embedded CSS/JS
- No server required
- Works offline
- Can be shared or saved anywhere

### 🎨 **Beautiful Design**
- Card-based layout (Trello-style)
- Color-coded columns
- Status icons (⏳ ▶ ✓ ◼ ✗)
- Responsive (mobile & desktop)
- Modern gradient background

### 📊 **Complete Overview**
- All 5 columns displayed
- Card counts per column
- Total card summary
- Session IDs (truncated)
- Task IDs (if linked)

### 🖱️ **Interactive**
- Click cards for visual feedback
- Hover effects
- Smooth animations
- Professional UI/UX

## Cross-Platform Support

Works on all platforms:
- **macOS**: Opens with `open` command
- **Windows**: Opens with `start` command
- **Linux**: Opens with `xdg-open` command

## Output Location

HTML file is saved to:
```
.kanhelper/kanban-board.html
```

## When to Use

Use `/kanboardweb` when you want to:
- **Share** your board with team members (send HTML file)
- **Present** board status in meetings
- **Archive** board state at a point in time
- **View** board in a more visual format
- **Print** or export board as PDF (from browser)

## Workflow

1. Make changes to cards using `/kancreate`, `/kanupdate`, etc.
2. Run `/kanboardweb` to generate updated HTML
3. Browser opens automatically showing current state
4. Refresh by running `/kanboardweb` again

## Distribution

This skill works in **any project** with the kanban system installed:
- Next.js projects ✅
- React projects ✅
- Node.js projects ✅
- Any JavaScript/TypeScript project ✅

## Example Output

The generated HTML includes:
- **Header**: Board title with emoji, statistics bar
- **Columns**: 5 columns (PENDING, IN PROGRESS, COMPLETED, PARKING LOT, DELETED)
- **Cards**: Card title, session ID (truncated), task ID
- **Footer**: Generation timestamp, refresh instructions

## Tips

### Sharing with Team
```bash
# Generate board
/kanboardweb

# Share the file
cp .kanhelper/kanban-board.html ~/Desktop/team-board.html
# Send team-board.html via email/Slack
```

### Archiving Board State
```bash
# Generate board
/kanboardweb

# Archive with date
cp .kanhelper/kanban-board.html archives/board-$(date +%Y-%m-%d).html
```

### Printing
1. Run `/kanboardweb`
2. In browser: File → Print
3. Choose "Save as PDF" or print directly

## Technical Details

- **File Size**: ~15-20 KB (depending on card count)
- **Dependencies**: None (standalone HTML)
- **Styling**: Embedded CSS (no external stylesheets)
- **JavaScript**: Minimal embedded JS for interactions
- **Browser Support**: All modern browsers

## Limitations

- **Static snapshot**: Does not auto-refresh (run command again to update)
- **No drag-drop**: Cards cannot be moved between columns
- **Read-only**: Cannot edit cards from web view
- **No server**: Cannot be shared via URL (share file instead)

For real-time features, consider running a server-based solution.
