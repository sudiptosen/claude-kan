/**
 * Migration framework for version-to-version schema changes
 */

import * as semver from 'semver';
import { Migration, MigrationContext } from './types.js';
import { readInstallationManifest, updateInstallationManifest } from './manifest.js';

// Migration registry
// Add new migrations here as needed
const migrations: Migration[] = [
  // Example migration structure:
  // {
  //   version: '1.1.0',
  //   name: 'add-priority-field',
  //   description: 'Add priority field to task cards',
  //   up: async (ctx) => {
  //     // Migration logic here
  //   },
  //   down: async (ctx) => {
  //     // Rollback logic here
  //   }
  // }
];

/**
 * Run applicable migrations from one version to another
 */
export async function runMigrations(
  fromVersion: string,
  toVersion: string
): Promise<void> {
  if (!fromVersion) return; // No migrations needed for fresh install

  console.log(`\n🔄 Running migrations from ${fromVersion} to ${toVersion}...`);

  // Find applicable migrations
  const applicable = migrations.filter(m =>
    semver.gt(m.version, fromVersion) &&
    semver.lte(m.version, toVersion)
  ).sort((a, b) => semver.compare(a.version, b.version));

  if (applicable.length === 0) {
    console.log('  ✓ No migrations needed');
    return;
  }

  const context: MigrationContext = {
    fromVersion,
    toVersion,
    projectRoot: process.cwd()
  };

  for (const migration of applicable) {
    console.log(`\n  Running: ${migration.name} (${migration.version})`);
    console.log(`  ${migration.description}`);

    try {
      await migration.up(context);
      console.log(`  ✓ Migration ${migration.name} completed`);

      // Record migration in manifest
      const manifest = readInstallationManifest();
      if (manifest) {
        manifest.migrations.push({
          from: fromVersion,
          to: migration.version,
          appliedAt: new Date().toISOString(),
          status: 'success'
        });
        updateInstallationManifest({ migrations: manifest.migrations });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`  ❌ Migration ${migration.name} failed:`, errorMessage);
      throw new Error(`Migration failed: ${migration.name}`);
    }
  }

  console.log(`\n  ✅ All migrations completed successfully`);
}
