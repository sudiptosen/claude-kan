---
name: kanboardweb
description: Generate interactive HTML view with React + Tailwind (zero dependencies)
---

# Kanboardweb Skill

Generates a beautiful, interactive HTML view of your Kanban board powered by React and Tailwind CSS. Opens automatically in your default browser.

## Command

`node .kanhelper/dist/skills/kanboardweb.js`

## Usage

```bash
/kanboardweb
```

Generates `.kanhelper/kanboard-react.html` and opens it automatically in your browser.

## ✨ Key Features

### 🚀 **Modern React UI - Zero Dependencies**
- React 18 + Tailwind CSS loaded from CDN
- Single HTML file (~50KB)
- No npm install required
- No build step needed
- Works offline after first load (CDN cached)

### 🎯 **Interactive Features**
- **🔍 Search**: Full-text search across all cards
- **🌓 Dark Mode**: Toggle between light/dark themes
- **📊 Progress Bars**: Visual progress indicators for tasks
- **🎯 Collapsible Columns**: Click headers to expand/collapse
- **🔎 Card Details**: Click any card for full details modal
- **✅ Filters**: Show/hide Parking Lot and Deleted columns

### 🎨 **Beautiful Design**
- Modern Tailwind CSS styling
- Responsive layout (mobile-first)
- Smooth animations and transitions
- Color-coded columns with icons
- Professional card hover effects

### 📱 **Fully Responsive**
- Desktop: 5-column grid layout
- Tablet: 2-3 column layout
- Mobile: Single column stack
- Touch-friendly interactions

## Interface Overview

### Header
- **Board Title**: Large "📋 KANBAN" heading
- **Dark Mode Toggle**: ☀️/🌙 button in top-right
- **Search Bar**: 🔍 Filter cards by title, session, or task ID
- **Filters**: Checkboxes for Parking Lot and Deleted columns
- **Statistics**: Live counts for each status

### Columns
Each column displays:
- **Icon + Title**: Visual identifier (⏳ Pending, ▶️ In Progress, etc.)
- **Card Count**: Number badge
- **Collapse Toggle**: ▶ arrow to hide/show cards
- **Progress Indicators**: For cards with task lists
- **Session Tags**: First 8 chars of session ID
- **Task IDs**: Linked task numbers

### Card Modal
Click any card to see:
- Full title and details
- Complete session ID
- Full task ID
- File path
- Progress breakdown with percentage
- Visual progress bar

## Interactive Commands

### Search
Type in search box to filter:
- Card titles
- Session IDs
- Task IDs
```
🔍 "implement auth" → Shows matching cards only
```

### Dark Mode
Click moon/sun icon to toggle theme:
- Light mode (default)
- Dark mode (saved in browser)

### Column Management
- Click column header to collapse/expand
- Use checkboxes to show/hide Parking Lot or Deleted

## Output Location

HTML file is saved to:
```
.kanhelper/kanboard-react.html
```

Previous static version (if exists):
```
.kanhelper/kb.html
```

## When to Use

Use `/kanboardweb` when you want to:
- **📱 View** board on mobile device
- **🔍 Search** for specific cards quickly
- **👥 Share** beautiful board with team
- **📊 Present** in meetings (dark mode for projectors)
- **💾 Archive** board state with interactivity
- **🌓 Demo** your workflow with professional UI

## Workflow

1. Make changes using `/kancreate`, `/kanupdate`, etc.
2. Run `/kanboardweb` to generate updated HTML
3. Browser opens automatically showing current state
4. Interact: search, filter, click cards, toggle dark mode
5. Refresh by running `/kanboardweb` again

## Cross-Platform Support

Works on all platforms:
- **macOS**: Opens with `open` command
- **Windows**: Opens with `start` command
- **Linux**: Opens with `xdg-open` command

Can also double-click HTML file to open.

## Distribution

This skill works in **any project** with the kanban system installed:
- Next.js projects ✅
- React projects ✅
- Node.js projects ✅
- Any JavaScript/TypeScript project ✅

## Sharing with Team

### Email/Slack
```bash
/kanboardweb
# Attach .kanhelper/kanboard-react.html
```

Recipients can:
- Open directly in browser (no server needed)
- Search and filter cards
- Toggle dark mode
- Click cards for details

### Archive with Timestamp
```bash
/kanboardweb
cp .kanhelper/kanboard-react.html archives/board-$(date +%Y-%m-%d).html
```

## Technical Details

### Technologies Used
- **React 18**: Via unpkg.com CDN (~130KB)
- **ReactDOM 18**: Via unpkg.com CDN (~130KB)
- **Babel Standalone**: For JSX transformation (~300KB)
- **Tailwind CSS**: Via cdn.tailwindcss.com (~50KB)

### Total Size
- HTML file: ~50KB (with embedded data)
- CDN assets: ~600KB (cached after first load)
- Load time: 1-2 seconds on first visit, instant thereafter

### Browser Support
- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Full support
- IE11: ❌ Not supported (modern browsers only)

### Offline Support
- CDN resources cached by browser
- Once loaded, works offline (until cache expires)
- For fully offline use, could inline React/Babel (makes file ~1MB)

## Advanced Features

### Progress Tracking
Cards with task lists show:
- Fraction completed (e.g., "3/5 steps")
- Percentage (e.g., "60%")
- Visual progress bar (blue = in progress, green = 100%)

### Column Configuration
Each column has:
- Unique color scheme
- Dark mode variants
- Icon identifier
- Collapsible state (persists during session)

### State Management
- Dark mode preference saved in browser
- Column collapse state maintained
- Search query cleared on reload
- Modal state for card details

## Limitations

### Static Snapshot
- Does not auto-refresh (run command again to update)
- Changes in filesystem require regeneration
- Not connected to live data source

### Read-Only
- Cannot edit cards from web view
- Cannot move cards between columns
- Cannot create new cards
- Cannot check/uncheck task items

For write operations, use CLI commands (`/kancreate`, `/kanupdate`, etc.)

### Internet Required (First Load)
- Needs internet to load React/Tailwind from CDN
- Subsequent loads work offline (cached)
- For fully offline, would need to inline libraries

## Comparison: Old vs React Version

| Feature | Old (Plain HTML) | New (React + Tailwind) |
|---------|-----------------|----------------------|
| File size | 15KB | 50KB |
| Load time | Instant | 1-2s (first load only) |
| Search | ❌ No | ✅ Yes |
| Dark mode | ❌ No | ✅ Yes |
| Filters | Basic toggle | Advanced checkboxes |
| Progress bars | ❌ No | ✅ Yes with % |
| Card details | ❌ No | ✅ Modal with full info |
| Mobile support | Basic | Fully responsive |
| Styling | Custom CSS | Tailwind utilities |
| Interactivity | Minimal | Rich React components |

## Tips & Tricks

### Quick Preview on Mobile
1. Run `/kanboardweb`
2. AirDrop/email HTML file to phone
3. Open in mobile browser
4. Use dark mode for OLED screens

### Presentation Mode
1. Run `/kanboardweb`
2. Enable dark mode (🌙)
3. Collapse empty columns
4. Search for specific project
5. Full screen browser (F11)

### Team Standup
1. Generate board before meeting
2. Share screen showing HTML
3. Click cards to discuss details
4. Use search to find specific tasks

### Archive Key Milestones
```bash
# End of sprint
/kanboardweb
cp .kanhelper/kanboard-react.html archives/sprint-12-complete.html

# Release day
/kanboardweb
cp .kanhelper/kanboard-react.html releases/v2.0.0-board.html
```

## Future Enhancements (Potential)

Could add:
- Export to PDF/PNG
- Print-optimized view
- Custom themes
- Keyboard shortcuts
- Drag-and-drop (read-only preview)
- Timeline view
- Burndown charts

For now, focused on being a beautiful, zero-dependency viewer.

## Related Skills

- `/kanboard` - Compact terminal view
- `/kanboardfull` - Detailed terminal view
- `/kancreate` - Create cards
- `/kanupdate` - Update card status/checkboxes
- `/kancard` - Query specific cards
