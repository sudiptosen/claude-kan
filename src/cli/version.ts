/**
 * Version detection and installation type determination
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as semver from 'semver';
import { InstallationContext, InstallationType } from './types.js';

/**
 * Get the currently installed version from .kanhelper/package.json
 */
export function getInstalledVersion(): string | null {
  const pkgPath = path.join(process.cwd(), '.kanhelper', 'package.json');
  if (!fs.existsSync(pkgPath)) return null;

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    return pkg.version;
  } catch (error) {
    return null;
  }
}

/**
 * Get the current package version being installed
 */
export function getCurrentVersion(): string {
  const pkgPath = path.resolve(__dirname, '../../package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  return pkg.version;
}

/**
 * Detect the type of installation (fresh, upgrade, reinstall, or downgrade)
 */
export function detectInstallationType(): InstallationContext {
  const installedVersion = getInstalledVersion();
  const currentVersion = getCurrentVersion();
  const hasUserData = checkUserDataExists();
  const hasModifications = checkForModifications();

  let type: InstallationType;

  if (!installedVersion) {
    type = 'fresh';
  } else if (installedVersion === currentVersion) {
    type = 'reinstall';
  } else if (semver.gt(currentVersion, installedVersion)) {
    type = 'upgrade';
  } else {
    type = 'downgrade';
  }

  return {
    type,
    installedVersion,
    currentVersion,
    hasUserData,
    hasModifications
  };
}

/**
 * Check if user data (task cards) exists in docs/tasks/
 * NOTE: We NEVER touch this data, just check if it exists for informational purposes
 */
export function checkUserDataExists(): boolean {
  const statusDirs = ['pending', 'in_progress', 'completed', 'parkinglot', 'deleted'];

  for (const status of statusDirs) {
    const dir = path.join('docs/tasks', status);
    if (!fs.existsSync(dir)) continue;

    try {
      const sessions = fs.readdirSync(dir);
      for (const session of sessions) {
        const sessionPath = path.join(dir, session);
        if (!fs.statSync(sessionPath).isDirectory()) continue;

        const cards = fs.readdirSync(sessionPath).filter(f => f.endsWith('.md'));
        if (cards.length > 0) return true;
      }
    } catch (error) {
      // If we can't read the directory, assume no user data
      continue;
    }
  }

  return false;
}

/**
 * Check if .kanhelper/dist/ has been modified since installation
 * NOTE: We only check dist/ - skills are always overwritten, user data is never touched
 */
export function checkForModifications(): boolean {
  const manifestPath = path.join('.kanhelper', 'installation.json');
  if (!fs.existsSync(manifestPath)) return false;

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    if (!manifest.checksums?.dist) return false;

    const currentDistHash = computeDirectoryHash('.kanhelper/dist');
    return manifest.checksums.dist !== currentDistHash;
  } catch (error) {
    return false;
  }
}

/**
 * Compute SHA-256 hash of a directory's contents
 */
export function computeDirectoryHash(dirPath: string): string {
  if (!fs.existsSync(dirPath)) return '';

  const hash = crypto.createHash('sha256');
  const files: string[] = [];

  function walkDir(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }

  walkDir(dirPath);

  // Sort files for consistent hashing
  files.sort();

  for (const file of files) {
    const relativePath = path.relative(dirPath, file);
    const content = fs.readFileSync(file);
    hash.update(relativePath);
    hash.update(content);
  }

  return hash.digest('hex');
}

/**
 * Get the size of a directory in bytes
 */
export function getDirectorySize(dirPath: string): number {
  if (!fs.existsSync(dirPath)) return 0;

  let totalSize = 0;

  function walkDir(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.isFile()) {
        const stats = fs.statSync(fullPath);
        totalSize += stats.size;
      }
    }
  }

  walkDir(dirPath);
  return totalSize;
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
