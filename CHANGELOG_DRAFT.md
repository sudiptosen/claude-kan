# Changelog Draft - Next Release

## Version 1.0.2 (Unreleased)

### 🎯 Major Features

#### Task List Checkbox Support
Complete task management system with automatic step generation and progress tracking.

**What's New:**
- ✅ **Auto-generated task lists** - Cards automatically create logical checkboxes from descriptions
- ✅ **Natural language checkbox commands** - Simple, intuitive syntax for managing tasks
- ✅ **Progress indicators** - Visual progress tracking on all board views
- ✅ **Smart regeneration** - Preserve completed items when regenerating steps

### New Features

#### 1. Intelligent Step Generation (Hybrid Approach)

When creating cards, the system now automatically generates task list checkboxes:

**Parses descriptions for tasks:**
```bash
kancreate --task-id "5" --subject "Implement auth" --description "1. Create login form
2. Add validation
3. Implement JWT"
```

Creates:
```markdown
- [ ] Create login form
- [ ] Add validation
- [ ] Implement JWT
```

**Fallback template for generic tasks:**
```markdown
- [ ] Plan and design approach
- [ ] Implement changes
- [ ] Test functionality
- [ ] Review and refine
- [ ] Mark complete
```

#### 2. Natural Language Checkbox Operations

Simple, intuitive commands for managing task checkboxes:

```bash
# Mark step as complete
kanupdate 3 check step 0

# Mark step as incomplete
kanupdate 3 uncheck step 1

# Toggle step completion
kanupdate 3 toggle step 2

# Regenerate all steps (preserves checked items)
kanupdate 3 regenerate steps

# Status updates still work
kanupdate 3 in_progress
```

#### 3. Visual Progress Indicators

**Compact Board (`/kanboard`):**
```
└─ ⏳ PENDING (1)
   └─ Implement auth [2/5] [8a7b9c12]
```

**Full Board (`/kanboardfull`):**
```
├─ PENDING [1 card]
│  └─ Implement auth [2/5 - 40%]
│     Session: 8a7b9c12-...
```

Color coding:
- 🔵 Cyan for in-progress (0-99%)
- 🟢 Green for complete (100%)

#### 4. Smart Step Regeneration

Preserves your progress while adding new tasks:

```bash
# Before: [x] Step 1, [x] Step 3, [ ] Step 2
kanupdate 3 regenerate steps

# After: Keeps checked items, adds new default steps
# [x] Step 1
# [x] Step 3
# [ ] Plan and design approach
# [ ] Implement changes
# [ ] Test functionality
```

### Developer Experience Improvements

#### Release Automation Scripts

Two new scripts for streamlined releases:

**1. Pre-Release Verification (`npm run verify`)**
- ✅ Checks 10 different aspects of the project
- ✅ Validates files, builds, templates, and functionality
- ✅ Reports issues clearly with actionable feedback

**2. Automated Release (`npm run release`)**
- ✅ Runs full verification
- ✅ Handles version bumping (patch/minor/major)
- ✅ Builds, commits, tags, publishes, and pushes
- ✅ Includes dry-run mode for testing
- ✅ Interactive prompts for uncommitted changes

**New npm scripts:**
```bash
npm run verify           # Run pre-release checks
npm run release          # Patch release (1.0.1 → 1.0.2)
npm run release:minor    # Minor release (1.0.1 → 1.1.0)
npm run release:major    # Major release (1.0.1 → 2.0.0)
npm run release:dry-run  # Test without publishing
```

### Technical Changes

**Modified Files:**
- `src/core/card.ts` - Added checkbox parsing, generation, and update functions
- `src/core/kanban.ts` - Enhanced board data with progress information
- `src/core/types.ts` - No changes (backward compatible)
- `src/skills/kancreate.ts` - Added auto-generation and `--steps` parameter
- `src/skills/kanupdate.ts` - Complete rewrite with natural language parsing
- `src/skills/kanboard.ts` - Added progress indicators
- `src/skills/kanboardfull.ts` - Added detailed progress display
- `package.json` - Added release script commands

**New Files:**
- `scripts/verify-release.sh` - Pre-release verification
- `scripts/release.sh` - Automated release process
- `scripts/README.md` - Documentation for release scripts

**New Functions (card.ts):**
- `parseCheckboxProgress()` - Parse steps and calculate completion
- `generateSteps()` - Auto-generate task list from description
- `extractStepsFromDescription()` - Parse numbered/bulleted lists
- `updateCheckbox()` - Toggle individual checkbox states
- `regenerateSteps()` - Regenerate with preservation of checked items

**Enhanced Interfaces:**
- `CheckboxProgress` - Track completion statistics
- `KanbanCard` - Now includes optional progress field

### Breaking Changes

**None** - This release is fully backward compatible.

- Existing cards without steps continue to work
- Old command syntax still supported (`kanupdate --task-id 3 --status pending`)
- No migration required

### Usage Examples

#### Claude Code Integration

Users can now interact naturally with Claude:

**User:** "Break down Card 3 into implementation steps"
**Claude:** Runs `kanupdate 3 regenerate steps`

**User:** "Mark step 2 of Card 5 as done"
**Claude:** Runs `kanupdate 5 check step 2`

**User:** "Show progress on all my tasks"
**Claude:** Displays board with `[X/Y]` indicators for each card

#### Creating Cards with Custom Steps

```bash
# Auto-generate from description
kancreate --task-id "7" --subject "Bug fix" --description "1. Reproduce bug
2. Identify root cause
3. Fix issue
4. Test fix"

# Custom steps via arguments
kancreate --task-id "8" --subject "Custom task" \
  --steps "Research options" "Make decision" "Implement solution"
```

#### Managing Checkbox Progress

```bash
# Check off completed steps
kanupdate 7 check step 0    # Reproduced bug ✓
kanupdate 7 check step 1    # Identified root cause ✓

# View progress
kanboard
# Shows: Bug fix [2/4]

# Continue work
kanupdate 7 check step 2    # Fixed issue ✓
kanupdate 7 check step 3    # Tested fix ✓

# View completion
kanboard
# Shows: Bug fix [4/4] (in green)
```

### Testing

All features tested end-to-end:
- ✅ Card creation with auto-generated steps
- ✅ Checkbox operations (check/uncheck/toggle)
- ✅ Progress display in both board views
- ✅ Step regeneration with preservation
- ✅ Backward compatibility with existing cards
- ✅ Multiline description handling in YAML
- ✅ Status updates still work correctly

### Migration Guide

**No migration required!**

The update is fully backward compatible:
1. Update package: `npm install claude-kan@latest`
2. Existing cards continue to work
3. New cards automatically get checkboxes
4. Start using natural language commands immediately

### Documentation

Updated documentation:
- New section on task list checkboxes in README
- Release script documentation in `scripts/README.md`
- Examples for natural language commands
- Claude Code integration patterns

### Known Limitations

- Step indices are 0-based (step 0, step 1, etc.)
- Maximum recommended steps per card: ~20 for optimal display
- Regenerate replaces all unchecked steps (by design)

### Future Enhancements (Potential)

- 📋 Subtask support (nested checkboxes)
- 🔄 Step reordering
- 📊 Project-wide progress dashboard
- 🏷️ Step labels/categories
- ⏰ Step time tracking
- 🔗 Step dependencies

### Contributors

- Sudipto Sen (@sudiptosen)

---

## How to Release This

1. **Review changes:**
   ```bash
   git status
   git diff
   ```

2. **Run verification:**
   ```bash
   npm run verify
   ```

3. **Test dry run:**
   ```bash
   npm run release:dry-run
   ```

4. **Release:**
   ```bash
   npm run release
   ```

5. **Verify on npm:**
   ```bash
   npm view claude-kan
   ```

6. **Create GitHub Release:**
   - Copy relevant sections from this changelog
   - Tag: v1.0.2
   - Title: "Task List Checkbox Support"
   - https://github.com/sudiptosen/claude-kan/releases/new
