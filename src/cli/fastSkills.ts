/**
 * Fast-skills: UserPromptSubmit hook installer.
 *
 * A Claude Code UserPromptSubmit hook can intercept slash-command prompts and
 * respond with pre-rendered text via the "block" decision — skipping the LLM
 * call entirely. This module installs, registers, enables, disables, and
 * verifies that hook for claude-kan.
 *
 * Files managed:
 *   ~/.claude/hooks/fast-skills.sh           The executable hook script
 *   ~/.claude/hooks/fast-skills.config.json  List of enabled skill names
 *   ~/.claude/settings.json                  Merged hooks.UserPromptSubmit entry
 *
 * The hook dispatches to <cwd>/.kanhelper/dist/skills/<name>.js, the per-project
 * install location. No user-home paths are hardcoded in the shipped script.
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export const HOOK_FILENAME = 'fast-skills.sh';
export const HOOK_CONFIG_FILENAME = 'fast-skills.config.json';

// Marker used to identify OUR entry inside hooks.UserPromptSubmit so we can
// update or remove it idempotently without touching unrelated entries.
export const HOOK_COMMAND_MARKER = 'fast-skills.sh';

export interface FastSkillsPaths {
  claudeDir: string;       // ~/.claude
  hooksDir: string;        // ~/.claude/hooks
  hookScript: string;      // ~/.claude/hooks/fast-skills.sh
  hookConfig: string;      // ~/.claude/hooks/fast-skills.config.json
  settingsFile: string;    // ~/.claude/settings.json
}

export function getFastSkillsPaths(home: string = os.homedir()): FastSkillsPaths {
  const claudeDir = path.join(home, '.claude');
  const hooksDir = path.join(claudeDir, 'hooks');
  return {
    claudeDir,
    hooksDir,
    hookScript: path.join(hooksDir, HOOK_FILENAME),
    hookConfig: path.join(hooksDir, HOOK_CONFIG_FILENAME),
    settingsFile: path.join(claudeDir, 'settings.json')
  };
}

/** Resolve the packaged fast-skills assets (shipped under dist/hooks/). */
export function getPackagedHookSource(): { script: string; config: string } {
  // __dirname at runtime is <packageRoot>/dist/cli
  const packageRoot = path.resolve(__dirname, '../..');
  return {
    script: path.join(packageRoot, 'dist', 'hooks', HOOK_FILENAME),
    config: path.join(packageRoot, 'dist', 'hooks', HOOK_CONFIG_FILENAME)
  };
}

/**
 * Install or update the fast-skills hook:
 *   1. Ensure ~/.claude/hooks/ exists
 *   2. Copy the hook script (always overwrite; mark executable)
 *   3. Create the config file if missing (don't clobber user customisations)
 *   4. Merge the hooks.UserPromptSubmit entry into settings.json
 *
 * Safe to run multiple times.
 */
export function installFastSkills(options: { home?: string; log?: (msg: string) => void } = {}): void {
  const log = options.log ?? (() => { /* no-op */ });
  const paths = getFastSkillsPaths(options.home);
  const packaged = getPackagedHookSource();

  if (!fs.existsSync(packaged.script)) {
    throw new Error(`Packaged fast-skills hook not found at: ${packaged.script}`);
  }

  // 1. Ensure dirs exist
  fs.mkdirSync(paths.hooksDir, { recursive: true });

  // 2. Copy (always overwrite) and chmod +x
  fs.copyFileSync(packaged.script, paths.hookScript);
  try {
    fs.chmodSync(paths.hookScript, 0o755);
  } catch {
    // On platforms where chmod is a no-op, ignore.
  }
  log(`  ✓ Hook script: ${paths.hookScript}`);

  // 3. Config: create only if missing
  if (!fs.existsSync(paths.hookConfig)) {
    if (fs.existsSync(packaged.config)) {
      fs.copyFileSync(packaged.config, paths.hookConfig);
    } else {
      fs.writeFileSync(paths.hookConfig, JSON.stringify({ enabledSkills: ['kanhelp'] }, null, 2) + '\n');
    }
    log(`  ✓ Hook config: ${paths.hookConfig}`);
  } else {
    log(`  - Hook config already exists (preserved): ${paths.hookConfig}`);
  }

  // 4. Settings merge
  const settingsResult = mergeHookIntoSettings(paths.settingsFile, paths.hookScript);
  if (settingsResult.changed) {
    log(`  ✓ Registered in: ${paths.settingsFile}`);
  } else {
    log(`  - Already registered in: ${paths.settingsFile}`);
  }
}

/**
 * Remove fast-skills:
 *   - Remove our settings.json entry (leave all other entries intact)
 *   - Delete the hook script from ~/.claude/hooks/
 *   - Preserve the config file (user may want to keep their enabled list)
 */
export function uninstallFastSkills(options: { home?: string; log?: (msg: string) => void; removeConfig?: boolean } = {}): void {
  const log = options.log ?? (() => { /* no-op */ });
  const paths = getFastSkillsPaths(options.home);

  const settingsResult = removeHookFromSettings(paths.settingsFile);
  if (settingsResult.changed) {
    log(`  ✓ Removed entry from: ${paths.settingsFile}`);
  } else {
    log(`  - No matching entry in: ${paths.settingsFile}`);
  }

  if (fs.existsSync(paths.hookScript)) {
    fs.rmSync(paths.hookScript);
    log(`  ✓ Removed hook script: ${paths.hookScript}`);
  } else {
    log(`  - Hook script already absent: ${paths.hookScript}`);
  }

  if (options.removeConfig && fs.existsSync(paths.hookConfig)) {
    fs.rmSync(paths.hookConfig);
    log(`  ✓ Removed hook config: ${paths.hookConfig}`);
  }
}

export interface FastSkillsStatus {
  hookInstalled: boolean;
  hookExecutable: boolean;
  configInstalled: boolean;
  registeredInSettings: boolean;
  enabledSkills: string[];
  paths: FastSkillsPaths;
}

/** Inspect the current state without modifying anything. */
export function checkFastSkills(home?: string): FastSkillsStatus {
  const paths = getFastSkillsPaths(home);

  const hookInstalled = fs.existsSync(paths.hookScript);
  let hookExecutable = false;
  if (hookInstalled) {
    try {
      const mode = fs.statSync(paths.hookScript).mode;
      // eslint-disable-next-line no-bitwise
      hookExecutable = (mode & 0o111) !== 0;
    } catch {
      hookExecutable = false;
    }
  }

  const configInstalled = fs.existsSync(paths.hookConfig);
  let enabledSkills: string[] = [];
  if (configInstalled) {
    try {
      const raw = fs.readFileSync(paths.hookConfig, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.enabledSkills)) {
        enabledSkills = parsed.enabledSkills.filter((x: unknown) => typeof x === 'string');
      }
    } catch {
      enabledSkills = [];
    }
  }

  const registeredInSettings = settingsContainsHook(paths.settingsFile);

  return {
    hookInstalled,
    hookExecutable,
    configInstalled,
    registeredInSettings,
    enabledSkills,
    paths
  };
}

// ---------------------------------------------------------------------------
// Settings merging (internal)
// ---------------------------------------------------------------------------

interface HookCommand {
  type: string;
  command: string;
}

interface HookEntry {
  hooks?: HookCommand[];
  [key: string]: unknown;
}

interface SettingsFile {
  hooks?: {
    UserPromptSubmit?: HookEntry[];
    [event: string]: HookEntry[] | undefined;
  };
  [key: string]: unknown;
}

function readSettings(file: string): SettingsFile {
  if (!fs.existsSync(file)) return {};
  try {
    const raw = fs.readFileSync(file, 'utf-8').trim();
    if (!raw) return {};
    return JSON.parse(raw) as SettingsFile;
  } catch (err) {
    throw new Error(
      `Cannot parse ${file}: ${err instanceof Error ? err.message : String(err)}. ` +
      `Fix the JSON syntax and re-run, or back up the file and delete it to start fresh.`
    );
  }
}

function writeSettings(file: string, settings: SettingsFile): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(settings, null, 2) + '\n');
}

function buildHookCommand(hookScriptPath: string): HookCommand {
  return {
    type: 'command',
    command: `bash ${hookScriptPath}`
  };
}

function isOurCommand(cmd: HookCommand | undefined): boolean {
  if (!cmd || typeof cmd.command !== 'string') return false;
  return cmd.command.includes(HOOK_COMMAND_MARKER);
}

/**
 * Merge our UserPromptSubmit entry into settings.json.
 *
 * Idempotency contract:
 *   - Leaves all other top-level keys untouched.
 *   - Leaves all other hook events untouched.
 *   - Leaves unrelated UserPromptSubmit entries untouched.
 *   - Replaces any prior fast-skills.sh entry so path changes (e.g. prototype
 *     → shipped hook) propagate cleanly.
 *
 * Returns { changed: true } if the file was actually modified.
 */
export function mergeHookIntoSettings(
  settingsFile: string,
  hookScriptPath: string
): { changed: boolean } {
  const settings = readSettings(settingsFile);
  const desired = buildHookCommand(hookScriptPath);

  if (!settings.hooks) settings.hooks = {};
  if (!settings.hooks.UserPromptSubmit) settings.hooks.UserPromptSubmit = [];

  const events = settings.hooks.UserPromptSubmit;
  let changed = false;

  // Find an existing entry that references fast-skills.sh. If found, ensure it
  // points at the right path (may differ from the prototype location).
  let foundEntry: HookEntry | undefined;
  for (const entry of events) {
    if (!entry || !Array.isArray(entry.hooks)) continue;
    for (const cmd of entry.hooks) {
      if (isOurCommand(cmd)) {
        foundEntry = entry;
        break;
      }
    }
    if (foundEntry) break;
  }

  if (foundEntry && Array.isArray(foundEntry.hooks)) {
    // Update only our command entries inside this entry, leaving siblings alone.
    const beforeJson = JSON.stringify(foundEntry.hooks);
    foundEntry.hooks = foundEntry.hooks.map(cmd =>
      isOurCommand(cmd) ? desired : cmd
    );
    const afterJson = JSON.stringify(foundEntry.hooks);
    if (beforeJson !== afterJson) changed = true;
  } else {
    // Append a fresh entry; do not disturb existing ones.
    events.push({ hooks: [desired] });
    changed = true;
  }

  if (changed) {
    writeSettings(settingsFile, settings);
  }
  return { changed };
}

/**
 * Remove our entry from settings.json while preserving everything else.
 * - Strips our command from any hook entry's hooks[] array.
 * - Drops now-empty entries.
 * - Drops UserPromptSubmit if it ends up empty.
 * - Drops the hooks key if it ends up empty.
 */
export function removeHookFromSettings(settingsFile: string): { changed: boolean } {
  if (!fs.existsSync(settingsFile)) return { changed: false };
  const settings = readSettings(settingsFile);
  if (!settings.hooks || !Array.isArray(settings.hooks.UserPromptSubmit)) {
    return { changed: false };
  }

  const before = JSON.stringify(settings.hooks);

  const filteredEntries = settings.hooks.UserPromptSubmit
    .map(entry => {
      if (!entry || !Array.isArray(entry.hooks)) return entry;
      const keptHooks = entry.hooks.filter(cmd => !isOurCommand(cmd));
      return { ...entry, hooks: keptHooks };
    })
    .filter(entry => {
      if (!entry || !Array.isArray(entry.hooks)) return true;
      return entry.hooks.length > 0;
    });

  if (filteredEntries.length === 0) {
    delete settings.hooks.UserPromptSubmit;
  } else {
    settings.hooks.UserPromptSubmit = filteredEntries;
  }

  if (settings.hooks && Object.keys(settings.hooks).length === 0) {
    delete settings.hooks;
  }

  const after = JSON.stringify(settings.hooks ?? {});
  if (before === after) return { changed: false };

  writeSettings(settingsFile, settings);
  return { changed: true };
}

function settingsContainsHook(settingsFile: string): boolean {
  if (!fs.existsSync(settingsFile)) return false;
  let settings: SettingsFile;
  try {
    settings = readSettings(settingsFile);
  } catch {
    return false;
  }
  const events = settings.hooks?.UserPromptSubmit;
  if (!Array.isArray(events)) return false;
  for (const entry of events) {
    if (!entry || !Array.isArray(entry.hooks)) continue;
    for (const cmd of entry.hooks) {
      if (isOurCommand(cmd)) return true;
    }
  }
  return false;
}
