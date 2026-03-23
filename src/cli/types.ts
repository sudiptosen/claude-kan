/**
 * Shared types for installation and upgrade system
 */

export type InstallationType = 'fresh' | 'upgrade' | 'reinstall' | 'downgrade';

export interface InstallationContext {
  type: InstallationType;
  installedVersion: string | null;
  currentVersion: string;
  hasUserData: boolean;
  hasModifications: boolean;
}

export interface InstallationManifest {
  version: string;
  installedAt: string;
  updatedAt: string;
  installationType: InstallationType;
  previousVersion?: string;
  migrations: MigrationRecord[];
  checksums: {
    dist: string;  // Only track .kanhelper/dist/ - skills are always overwritten
  };
}

export interface MigrationRecord {
  from: string;
  to: string;
  appliedAt: string;
  status: 'success' | 'failed';
}

export interface BackupManifest {
  version: string;
  timestamp: string;
  reason: 'pre-upgrade' | 'pre-reinstall' | 'manual';
  filesBackedUp: string[];
  size: number;
}

export interface Migration {
  version: string;
  name: string;
  description: string;
  up: (context: MigrationContext) => Promise<void>;
  down: (context: MigrationContext) => Promise<void>;
}

export interface MigrationContext {
  fromVersion: string;
  toVersion: string;
  projectRoot: string;
}
