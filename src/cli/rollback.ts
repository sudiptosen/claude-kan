/**
 * Rollback system to restore previous installations
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { BackupManifest } from './types.js';
import { formatBytes } from './version.js';

/**
 * Rollback to a previous version using a backup
 */
export async function rollback(backupName?: string): Promise<void> {
  console.log('\n🔙 Rolling back installation...\n');

  const backupsDir = path.join('.kanhelper', 'backups');

  if (!fs.existsSync(backupsDir)) {
    throw new Error('No backups found. Cannot rollback.');
  }

  // List available backups
  const backups = fs.readdirSync(backupsDir)
    .filter(name => {
      const manifestPath = path.join(backupsDir, name, 'backup-manifest.json');
      return fs.existsSync(manifestPath);
    })
    .map(name => ({
      name,
      path: path.join(backupsDir, name),
      manifest: JSON.parse(
        fs.readFileSync(path.join(backupsDir, name, 'backup-manifest.json'), 'utf-8')
      ) as BackupManifest
    }))
    .sort((a, b) =>
      new Date(b.manifest.timestamp).getTime() -
      new Date(a.manifest.timestamp).getTime()
    );

  if (backups.length === 0) {
    throw new Error('No backups available for rollback.');
  }

  let selectedBackup;

  if (backupName) {
    selectedBackup = backups.find(b => b.name === backupName);
    if (!selectedBackup) {
      throw new Error(`Backup not found: ${backupName}`);
    }
  } else {
    // Use most recent backup
    selectedBackup = backups[0];
  }

  console.log('📦 Rollback Details:');
  console.log(`   Backup: ${selectedBackup.name}`);
  console.log(`   Version: ${selectedBackup.manifest.version}`);
  console.log(`   Created: ${new Date(selectedBackup.manifest.timestamp).toLocaleString()}`);
  console.log(`   Size: ${formatBytes(selectedBackup.manifest.size)}\n`);

  // Confirm rollback
  const confirmed = await confirm('Proceed with rollback?');
  if (!confirmed) {
    console.log('❌ Rollback cancelled');
    return;
  }

  await rollbackFromPath(selectedBackup.path);

  console.log('\n✅ Rollback complete!');
  console.log(`\nRestored to version: ${selectedBackup.manifest.version}`);
}

/**
 * Restore from a backup directory
 */
export async function rollbackFromPath(backupPath: string): Promise<void> {
  console.log('\n🔄 Restoring from backup...');

  // Restore .kanhelper/dist/
  if (fs.existsSync(path.join(backupPath, 'dist'))) {
    if (fs.existsSync('.kanhelper/dist')) {
      fs.rmSync('.kanhelper/dist', { recursive: true });
    }
    copyRecursive(path.join(backupPath, 'dist'), '.kanhelper/dist');
    console.log('  ✓ Restored .kanhelper/dist/');
  }

  // Restore installation manifest
  if (fs.existsSync(path.join(backupPath, 'installation.json'))) {
    fs.copyFileSync(
      path.join(backupPath, 'installation.json'),
      '.kanhelper/installation.json'
    );
    console.log('  ✓ Restored installation.json');
  }

  // NOTE: Skills are NOT restored from backup
  //       - After rollback, run `npx claude-kan init` to reinstall skills for the rollback version
  console.log('\n⚠️  After rollback, run `npx claude-kan init` to update skills to match this version');
}

/**
 * List all available backups
 */
export function listBackups(): void {
  const backupsDir = path.join('.kanhelper', 'backups');

  if (!fs.existsSync(backupsDir)) {
    console.log('No backups found.');
    return;
  }

  const backups = fs.readdirSync(backupsDir)
    .filter(name => {
      const manifestPath = path.join(backupsDir, name, 'backup-manifest.json');
      return fs.existsSync(manifestPath);
    })
    .map(name => ({
      name,
      manifest: JSON.parse(
        fs.readFileSync(path.join(backupsDir, name, 'backup-manifest.json'), 'utf-8')
      ) as BackupManifest
    }))
    .sort((a, b) =>
      new Date(b.manifest.timestamp).getTime() -
      new Date(a.manifest.timestamp).getTime()
    );

  if (backups.length === 0) {
    console.log('No backups found.');
    return;
  }

  console.log('\n📦 Available Backups:\n');

  for (const backup of backups) {
    console.log(`  ${backup.name}`);
    console.log(`    Version: ${backup.manifest.version}`);
    console.log(`    Created: ${new Date(backup.manifest.timestamp).toLocaleString()}`);
    console.log(`    Size: ${formatBytes(backup.manifest.size)}`);
    console.log();
  }
}

/**
 * Helper function for user confirmation
 */
async function confirm(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(`${message} (Y/n) `, answer => {
      rl.close();
      resolve(answer.toLowerCase() !== 'n');
    });
  });
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
