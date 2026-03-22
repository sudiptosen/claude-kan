#!/bin/bash
# Pre-release verification script for claude-kan
# Checks if everything is ready for release

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track failures
FAILURES=0

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}🔍 Claude-Kan Release Verification${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Function to report check results
check_pass() {
  echo -e "${GREEN}✅ $1${NC}"
}

check_fail() {
  echo -e "${RED}❌ $1${NC}"
  FAILURES=$((FAILURES + 1))
}

check_warn() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

check_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

# 1. Check Node.js and npm versions
echo -e "${BLUE}[1/10] Checking Node.js and npm...${NC}"
if command -v node &> /dev/null; then
  NODE_VERSION=$(node --version)
  check_pass "Node.js version: $NODE_VERSION"
else
  check_fail "Node.js is not installed"
fi

if command -v npm &> /dev/null; then
  NPM_VERSION=$(npm --version)
  check_pass "npm version: $NPM_VERSION"
else
  check_fail "npm is not installed"
fi
echo ""

# 2. Check package.json validity
echo -e "${BLUE}[2/10] Validating package.json...${NC}"
if [ -f "package.json" ]; then
  check_pass "package.json exists"

  # Check required fields
  PACKAGE_NAME=$(node -p "require('./package.json').name" 2>/dev/null || echo "")
  PACKAGE_VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "")
  PACKAGE_MAIN=$(node -p "require('./package.json').main" 2>/dev/null || echo "")

  if [ -n "$PACKAGE_NAME" ]; then
    check_pass "Package name: $PACKAGE_NAME"
  else
    check_fail "Package name is missing"
  fi

  if [ -n "$PACKAGE_VERSION" ]; then
    check_pass "Package version: $PACKAGE_VERSION"
  else
    check_fail "Package version is missing"
  fi

  if [ -n "$PACKAGE_MAIN" ]; then
    check_pass "Package main: $PACKAGE_MAIN"
  else
    check_warn "Package main is missing (might be intentional)"
  fi
else
  check_fail "package.json not found"
fi
echo ""

# 3. Check required files
echo -e "${BLUE}[3/10] Checking required files...${NC}"
REQUIRED_FILES=("README.md" "LICENSE" "package.json" "tsconfig.json")
for file in "${REQUIRED_FILES[@]}"; do
  if [ -f "$file" ]; then
    check_pass "$file exists"
  else
    check_fail "$file is missing"
  fi
done
echo ""

# 4. Check source structure
echo -e "${BLUE}[4/10] Checking source structure...${NC}"
REQUIRED_DIRS=("src" "src/core" "src/skills" "src/templates")
for dir in "${REQUIRED_DIRS[@]}"; do
  if [ -d "$dir" ]; then
    check_pass "$dir/ exists"
  else
    check_fail "$dir/ is missing"
  fi
done
echo ""

# 5. Check skill templates
echo -e "${BLUE}[5/10] Checking skill templates...${NC}"
SKILL_DIRS=("kanboard" "kanboardfull" "kancreate" "kanupdate" "kancard" "kansync" "kanprune" "kandoctor" "kanhelp")
SKILLS_FOUND=0
for skill in "${SKILL_DIRS[@]}"; do
  if [ -d "src/templates/skill-templates/$skill" ]; then
    if [ -f "src/templates/skill-templates/$skill/SKILL.md" ]; then
      SKILLS_FOUND=$((SKILLS_FOUND + 1))
      check_pass "$skill skill template"
    else
      check_fail "$skill/SKILL.md is missing"
    fi
  else
    check_fail "$skill skill directory is missing"
  fi
done
check_info "Found $SKILLS_FOUND/${#SKILL_DIRS[@]} skill templates"
echo ""

# 6. Install dependencies
echo -e "${BLUE}[6/10] Installing dependencies...${NC}"
if npm install --silent; then
  check_pass "Dependencies installed successfully"
else
  check_fail "Failed to install dependencies"
fi
echo ""

# 7. TypeScript compilation
echo -e "${BLUE}[7/10] Compiling TypeScript...${NC}"
if npm run build > /dev/null 2>&1; then
  check_pass "TypeScript compilation successful"
else
  check_fail "TypeScript compilation failed"
  echo -e "${YELLOW}Run 'npm run build' to see errors${NC}"
fi
echo ""

# 8. Check compiled output
echo -e "${BLUE}[8/10] Checking compiled output...${NC}"
if [ -d "dist" ]; then
  check_pass "dist/ directory exists"

  # Check key compiled files
  COMPILED_FILES=("dist/cli/index.js" "dist/core/card.js" "dist/skills/kanboard.js")
  for file in "${COMPILED_FILES[@]}"; do
    if [ -f "$file" ]; then
      check_pass "$(basename $file) compiled"
    else
      check_warn "$(basename $file) not found in dist/"
    fi
  done
else
  check_fail "dist/ directory not found (build may have failed)"
fi
echo ""

# 9. Test basic functionality
echo -e "${BLUE}[9/10] Testing basic functionality...${NC}"
if [ -f "dist/skills/kanhelp.js" ]; then
  if node dist/skills/kanhelp.js > /dev/null 2>&1; then
    check_pass "kanhelp skill executes"
  else
    check_warn "kanhelp skill execution failed"
  fi
else
  check_fail "kanhelp skill not found"
fi

if [ -f "dist/skills/kanboard.js" ]; then
  # kanboard might fail if no cards exist, which is okay
  if node dist/skills/kanboard.js > /dev/null 2>&1 || [ $? -eq 0 ]; then
    check_pass "kanboard skill executes"
  else
    check_warn "kanboard skill execution returned non-zero (may be expected)"
  fi
else
  check_fail "kanboard skill not found"
fi
echo ""

# 10. Check git status
echo -e "${BLUE}[10/10] Checking git status...${NC}"
if git rev-parse --git-dir > /dev/null 2>&1; then
  check_pass "Git repository detected"

  # Check for uncommitted changes
  if [ -z "$(git status --porcelain)" ]; then
    check_pass "Working directory is clean"
  else
    check_warn "There are uncommitted changes"
    echo -e "${YELLOW}Uncommitted files:${NC}"
    git status --short
  fi

  # Check for remote
  if git remote -v | grep -q origin; then
    REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "unknown")
    check_pass "Git remote configured: $REMOTE_URL"
  else
    check_warn "No git remote configured"
  fi
else
  check_warn "Not a git repository"
fi
echo ""

# Summary
echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}📊 Verification Summary${NC}"
echo -e "${BLUE}================================${NC}"

if [ $FAILURES -eq 0 ]; then
  echo -e "${GREEN}✅ All checks passed! Ready for release.${NC}"
  echo ""
  echo -e "${GREEN}Next steps:${NC}"
  echo -e "  1. Review changes: ${YELLOW}git diff${NC}"
  echo -e "  2. Run release script: ${YELLOW}npm run release${NC}"
  echo -e "  3. Or manually: ${YELLOW}npm version patch && npm publish${NC}"
  exit 0
else
  echo -e "${RED}❌ $FAILURES check(s) failed${NC}"
  echo -e "${RED}Please fix the issues above before releasing${NC}"
  exit 1
fi
