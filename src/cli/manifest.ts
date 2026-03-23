/**
 * Installation manifest management
 */

import * as fs from 'fs';
import * as path from 'path';
import { InstallationManifest, InstallationContext } from './types.js';
import { computeDirectoryHash } from './version.js';

const MANIFEST_PATH = '.kanhelper/installation.json';

/**
 * Create a new installation manifest
 */
export function createInstallationManifest(context: InstallationContext): void {
  const manifest: InstallationManifest = {
    version: context.currentVersion,
    installedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    installationType: context.type,
    previousVersion: context.installedVersion || undefined,
    migrations: [],
    checksums: {
      dist: computeDirectoryHash('.kanhelper/dist')
      // Skills are not tracked - they're always overwritten
    }
  };

  fs.writeFileSync(
    MANIFEST_PATH,
    JSON.stringify(manifest, null, 2)
  );
}

/**
 * Read the installation manifest
 */
export function readInstallationManifest(): InstallationManifest | null {
  if (!fs.existsSync(MANIFEST_PATH)) return null;

  try {
    return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
  } catch (error) {
    return null;
  }
}

/**
 * Update the installation manifest with partial data
 */
export function updateInstallationManifest(updates: Partial<InstallationManifest>): void {
  const manifest = readInstallationManifest() || {} as InstallationManifest;
  Object.assign(manifest, updates);
  manifest.updatedAt = new Date().toISOString();

  fs.writeFileSync(
    MANIFEST_PATH,
    JSON.stringify(manifest, null, 2)
  );
}
