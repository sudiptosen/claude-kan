#!/usr/bin/env node
/**
 * Session Debug skill - Diagnostic tool for session information
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('\n🔍 SESSION DEBUG INFORMATION\n');
console.log('═'.repeat(80));

// 1. Environment Variables
console.log('\n📦 ENVIRONMENT VARIABLES\n');
console.log('CLAUDE_SESSION_ID:', process.env.CLAUDE_SESSION_ID || '(not set)');

const claudeVars = Object.keys(process.env).filter(k => k.startsWith('CLAUDE_'));
if (claudeVars.length > 0) {
  console.log('\nAll CLAUDE_* variables:');
  claudeVars.forEach(key => {
    console.log(`  ${key}: ${process.env[key]}`);
  });
} else {
  console.log('\nNo CLAUDE_* environment variables found');
}

// 2. Process Information
console.log('\n⚙️  PROCESS INFORMATION\n');
console.log('Process ID (PID):', process.pid);
console.log('Parent PID:', process.ppid);
console.log('Current working directory:', process.cwd());
console.log('Node version:', process.version);
console.log('Platform:', process.platform);

try {
  const parentInfo = execSync(`ps -p ${process.ppid} -o comm=`, { encoding: 'utf-8' }).trim();
  console.log('Parent process:', parentInfo);
} catch (error) {
  console.log('Parent process: (unable to determine)');
}

// 3. Git Information
console.log('\n🔀 GIT INFORMATION\n');
try {
  const gitBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
  console.log('Current git branch:', gitBranch);

  const gitRoot = execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
  console.log('Git root:', gitRoot);

  const shortHash = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
  console.log('Current commit (short):', shortHash);
} catch (error) {
  console.log('Not in a git repository or git not available');
}

// 4. Claude Code Configuration Files
console.log('\n📁 CLAUDE CODE FILES\n');

const claudePaths = [
  '.claude/session',
  '.claude/current-session',
  '.claude/session-id',
  '.claude/config.json',
  path.join(process.env.HOME || '~', '.claude/session'),
  path.join(process.env.HOME || '~', '.claude/config.json'),
];

claudePaths.forEach(p => {
  const fullPath = p.startsWith('.claude') ? path.join(process.cwd(), p) : p;
  if (fs.existsSync(fullPath)) {
    console.log(`✓ Found: ${p}`);
    try {
      const stat = fs.statSync(fullPath);
      if (stat.isFile() && stat.size < 1024) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        console.log(`  Content preview: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`);
      }
    } catch (err) {
      console.log(`  (unable to read)`);
    }
  } else {
    console.log(`✗ Not found: ${p}`);
  }
});

// 5. Suggested Session ID Sources
console.log('\n💡 SUGGESTED SESSION ID SOURCES\n');

// Try different methods to get a session ID
const suggestions = [];

// Method 1: Environment variable
if (process.env.CLAUDE_SESSION_ID) {
  suggestions.push({
    method: 'Environment Variable',
    source: 'process.env.CLAUDE_SESSION_ID',
    value: process.env.CLAUDE_SESSION_ID
  });
}

// Method 2: Git branch
try {
  const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
  if (branch && branch !== 'main' && branch !== 'master') {
    suggestions.push({
      method: 'Git Branch',
      source: 'git rev-parse --abbrev-ref HEAD',
      value: branch
    });
  }
} catch (err) {
  // Ignore
}

// Method 3: Process ID based
suggestions.push({
  method: 'Process-based (fallback)',
  source: 'timestamp + random',
  value: `session-${Date.now()}-${Math.random().toString(36).substring(7)}`
});

console.log('Available session ID options (in priority order):');
suggestions.forEach((s, i) => {
  console.log(`\n${i + 1}. ${s.method}`);
  console.log(`   Source: ${s.source}`);
  console.log(`   Value: ${s.value}`);
});

console.log('\n═'.repeat(80));
console.log('\n✅ Debug complete\n');
