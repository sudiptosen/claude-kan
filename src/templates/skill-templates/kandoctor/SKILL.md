---
name: kandoctor
description: Validate Kanban system installation and health
---

# Kandoctor Skill

Comprehensive diagnostic tool that validates the Kanban system installation and health status.

## Command

`node .kanhelper/dist/skills/kandoctor.js`

## Usage

Type `/kandoctor` to run a complete health check.

## What It Checks

### 1. Directory Structure
- All status folders (pending, in_progress, completed, parkinglot, deleted)
- Required files (todo.md, lessons.md)

### 2. Kanban Helper
- Package installation
- Compiled code (dist/)
- All skill files
- Hook files

### 3. Plugin Installation
- Plugin directory structure
- Configuration files
- Hook definitions

### 4. Skills Installation
- All skill directories
- SKILL.md files for each skill

### 5. Configuration
- todo.md frontmatter and session tracking
- .gitignore entries
- Dependencies (node_modules)

### 6. Session & Cards
- **Current session ID detection** (from Claude Code files)
- Card counts by status

## Health Score

The tool provides an overall health percentage:
- **90%+**: Excellent
- **70-89%**: Good with minor issues
- **50-69%**: Needs attention
- **<50%**: Critical issues

## Recommendations

If issues are found, kandoctor provides specific recommendations for fixing them.
