/**
 * Backup system for .kanhelper/dist/
 */

import * as fs from 'fs';
import * as path from 'path';
import { BackupManifest } from './types.js';
import { getInstalledVersion, getDirectorySize, formatBytes } from './version.js';

/**
 * Create a backup of .kanhelper/dist/ and installation.json
 */
export async function createBackup(reason: string): Promise<string> {
  const installedVersion = getInstalledVersion() || 'unknown';
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const backupName = `${timestamp}_v${installedVersion}_${reason}`;
  const backupDir = path.join('.kanhelper', 'backups', backupName);

  console.log(`\n💾 Creating backup: ${backupName}...`);
  fs.mkdirSync(backupDir, { recursive: true });

  const filesBackedUp: string[] = [];
  let totalSize = 0;

  // Backup ONLY .kanhelper/dist/ (may contain user customizations)
  if (fs.existsSync('.kanhelper/dist')) {
    copyRecursive('.kanhelper/dist', path.join(backupDir, 'dist'));
    filesBackedUp.push('dist/');
    totalSize += getDirectorySize('.kanhelper/dist');
  }

  // Backup installation manifest
  if (fs.existsSync('.kanhelper/installation.json')) {
    fs.copyFileSync(
      '.kanhelper/installation.json',
      path.join(backupDir, 'installation.json')
    );
    filesBackedUp.push('installation.json');
  }

  // NOTE: Skills (.claude/skills/) are NOT backed up
  //       - They're system files that are ALWAYS OVERWRITTEN
  // NOTE: User data (docs/tasks/) is NEVER touched, so no backup needed

  // Create backup manifest
  const backupManifest: BackupManifest = {
    version: installedVersion,
    timestamp: new Date().toISOString(),
    reason: reason as any,
    filesBackedUp,
    size: totalSize
  };

  fs.writeFileSync(
    path.join(backupDir, 'backup-manifest.json'),
    JSON.stringify(backupManifest, null, 2)
  );

  console.log(`  ✓ Backed up ${filesBackedUp.length} items (${formatBytes(totalSize)})`);
  console.log(`  ✓ Backup location: ${backupDir}`);

  return backupDir;
}

/**
 * Clean old backups, keeping only the most recent {keepCount}
 */
export async function cleanOldBackups(keepCount: number = 5): Promise<void> {
  const backupsDir = path.join('.kanhelper', 'backups');
  if (!fs.existsSync(backupsDir)) return;

  const backups = fs.readdirSync(backupsDir)
    .map(name => ({
      name,
      path: path.join(backupsDir, name),
      mtime: fs.statSync(path.join(backupsDir, name)).mtime.getTime()
    }))
    .sort((a, b) => b.mtime - a.mtime);

  const toDelete = backups.slice(keepCount);

  if (toDelete.length > 0) {
    console.log(`\n🧹 Cleaning up old backups (keeping ${keepCount} most recent)...`);
    for (const backup of toDelete) {
      fs.rmSync(backup.path, { recursive: true });
      console.log(`  ✓ Removed: ${backup.name}`);
    }
  }
}

/**
 * Recursively copy a directory
 */
function copyRecursive(src: string, dest: string): void {
  if (!fs.existsSync(src)) return;

  const stats = fs.statSync(src);

  if (stats.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src);

    for (const entry of entries) {
      copyRecursive(
        path.join(src, entry),
        path.join(dest, entry)
      );
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}
