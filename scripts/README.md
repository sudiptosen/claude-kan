# Release Scripts

This directory contains automated scripts for verifying and releasing claude-kan to npm.

## Scripts Overview

### 1. `verify-release.sh` - Pre-Release Verification

Comprehensive check to ensure everything is ready for release.

**What it checks:**
- ✅ Node.js and npm versions
- ✅ package.json validity
- ✅ Required files (README, LICENSE, etc.)
- ✅ Source structure
- ✅ Skill templates (all 9 skills)
- ✅ Dependency installation
- ✅ TypeScript compilation
- ✅ Compiled output
- ✅ Basic functionality tests
- ✅ Git status and remote

**Usage:**
```bash
# Run directly
./scripts/verify-release.sh

# Or via npm
npm run verify
```

**Exit codes:**
- `0` - All checks passed, ready for release
- `1` - One or more checks failed

### 2. `release.sh` - Automated Release

Fully automated release process that:
1. Runs verification
2. Handles uncommitted changes (prompts to commit)
3. Bumps version
4. Builds project
5. Runs tests (if any)
6. Commits version bump
7. Creates git tag
8. Publishes to npm
9. Pushes to GitHub

**Usage:**

```bash
# Patch release (1.0.1 → 1.0.2) - default
npm run release

# Minor release (1.0.1 → 1.1.0)
npm run release:minor

# Major release (1.0.1 → 2.0.0)
npm run release:major

# Dry run (test without actually publishing)
npm run release:dry-run

# Direct script usage
./scripts/release.sh patch
./scripts/release.sh minor
./scripts/release.sh major
./scripts/release.sh patch --dry-run
```

**Prerequisites:**
- Must be logged into npm: `npm login`
- Git remote must be configured
- Working directory should be clean (or script will prompt to commit)

**What it does automatically:**
- ✅ Verifies everything is ready
- ✅ Bumps package.json version
- ✅ Builds TypeScript
- ✅ Commits changes with proper message
- ✅ Creates git tag (e.g., `v1.0.2`)
- ✅ Publishes to npm as public package
- ✅ Pushes commits and tags to GitHub

## Typical Release Workflow

### First Time Setup

1. **Login to npm:**
   ```bash
   npm login
   ```

2. **Verify git remote:**
   ```bash
   git remote -v
   # Should show: https://github.com/sudiptosen/claude-kan.git
   ```

### For Each Release

1. **Make your changes** and commit them

2. **Run verification:**
   ```bash
   npm run verify
   ```

   If verification fails, fix issues and try again.

3. **Test dry run (recommended):**
   ```bash
   npm run release:dry-run
   ```

   This shows what would happen without actually publishing.

4. **Release:**
   ```bash
   # For bug fixes and small changes (patch)
   npm run release

   # For new features (minor)
   npm run release:minor

   # For breaking changes (major)
   npm run release:major
   ```

5. **Verify release:**
   ```bash
   # Check npm
   npm view claude-kan

   # Test installation
   npx claude-kan@latest init
   ```

6. **Create GitHub Release (optional):**
   - Go to: https://github.com/sudiptosen/claude-kan/releases/new
   - Select the new tag (e.g., `v1.0.2`)
   - Add release notes
   - Publish release

## Version Numbering (Semantic Versioning)

- **Patch** (1.0.1 → 1.0.2): Bug fixes, small improvements
- **Minor** (1.0.1 → 1.1.0): New features, backward compatible
- **Major** (1.0.1 → 2.0.0): Breaking changes

## Troubleshooting

### "Not logged in to npm"
```bash
npm login
npm whoami  # Verify
```

### "Git has uncommitted changes"
The script will prompt you to commit them. You can either:
- Commit them when prompted
- Manually commit before running: `git add . && git commit -m "message"`

### "Build failed"
```bash
npm run build
# Check for TypeScript errors
```

### "Tests failed"
```bash
npm test
# Fix failing tests before releasing
```

### "npm publish failed"
The version was already bumped and committed. To fix:
1. Fix the issue (check npm credentials, package name, etc.)
2. Manually publish: `npm publish --access public`
3. Push to GitHub: `git push && git push --tags`

### Want to undo a version bump?
If you bumped version but didn't publish yet:
```bash
git reset --hard HEAD~1  # Undo commit
git tag -d v1.0.2        # Delete tag
```

## Manual Release (Without Scripts)

If you prefer manual control:

```bash
# 1. Verify
npm run verify

# 2. Bump version
npm version patch  # or minor or major

# 3. Build
npm run build

# 4. Publish
npm publish --access public

# 5. Push
git push && git push --tags
```

## CI/CD Integration

To use these scripts in CI/CD:

```yaml
# Example GitHub Actions workflow
name: Release
on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version bump type'
        required: true
        default: 'patch'
        type: choice
        options:
          - patch
          - minor
          - major

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: npm ci

      - name: Verify
        run: npm run verify

      - name: Release
        run: ./scripts/release.sh ${{ github.event.inputs.version }}
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Security Notes

- Never commit npm credentials or tokens to the repository
- Use `NPM_TOKEN` environment variable in CI/CD
- Always use `--access public` for public packages
- Review changes with dry-run before actual release

## Support

For issues with the release scripts, please open an issue at:
https://github.com/sudiptosen/claude-kan/issues
