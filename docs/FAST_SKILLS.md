# Fast-Skills

Fast-skills is a Claude Code `UserPromptSubmit` hook that intercepts selected
slash-command prompts (e.g. `/kanhelp`) and runs the corresponding compiled
skill locally, returning the skill's stdout via the hook's `block` decision.
**The LLM is never called** for these prompts — zero tokens, zero API cost,
instant response.

---

## How it works

1. The user types a prompt in Claude Code, e.g. `/kanhelp`.
2. Claude Code invokes every `UserPromptSubmit` hook registered in
   `~/.claude/settings.json`, passing a JSON payload on stdin that includes the
   `prompt` and the current working directory (`cwd`).
3. The fast-skills hook (`~/.claude/hooks/fast-skills.sh`):
   - Extracts the first token after the slash (e.g. `kanhelp`).
   - Looks it up against the enabled-skills list in
     `~/.claude/hooks/fast-skills.config.json`.
   - If enabled, runs `node <cwd>/.kanhelper/dist/skills/<name>.js`.
   - Emits `{"decision":"block","reason":"<stripped stdout>"}` on stdout.
4. Claude Code displays the reason text inline and skips the LLM entirely.
5. If the prompt is not a slash command, not enabled, or the skill file is not
   present in the project, the hook exits silently and the prompt proceeds
   normally.

---

## Trade-offs

- **ANSI colors are stripped.** The block-reason channel renders plain text, so
  coloured output from the skill is flattened. Keep this in mind when picking
  which skills to fast-path — skills whose information density depends heavily
  on colour (e.g. `/kanboard`) are better left on the normal path.
- **No arguments.** Only the skill name is matched; anything after it is
  ignored by the hook. Skills that take arguments (`/kancreate`, `/kanupdate`,
  `/kancard`, `/kanprune`) must not be fast-pathed.
- **No state mutation.** Fast-pathed skills should be read-only/idempotent.
  The hook gives you the benefit of skipping the LLM — don't sneak side
  effects into that path.
- **Project-local resolution.** The hook uses the `cwd` in the hook payload to
  find the skill under `<cwd>/.kanhelper/dist/skills/`. If the project hasn't
  been initialised with `claude-kan init`, the hook no-ops and the prompt
  proceeds normally.

---

## Which skills are eligible?

A skill is a good fast-skills candidate when **all** of the following hold:

1. It takes no arguments.
2. It performs no writes (no file mutations, no external calls).
3. Its output is useful as plain text (no hard dependency on ANSI colour or
   terminal width).

### Classification for claude-kan

| Skill           | Pure static? | Fast-path default |
| --------------- | ------------ | ----------------- |
| `/kanhelp`      | Yes          | Enabled           |
| `/kanboard`     | Reads state, colourful | Disabled (opt-in) |
| `/kanboardfull` | Reads state, colourful | Disabled (opt-in) |
| `/kandoctor`    | Reads state, colourful | Disabled (opt-in) |
| `/kansync`      | Mutates      | Never             |
| `/kancreate`    | Args + mutates | Never             |
| `/kanupdate`    | Args + mutates | Never             |
| `/kancard`      | Args         | Never             |
| `/kanprune`     | Destructive  | Never             |
| `/kanboardweb`  | Writes HTML file | Never           |

Only `/kanhelp` is enabled by default because it is the only skill that is
argument-free, side-effect-free, *and* largely unaffected by ANSI stripping.

---

## Installation

Fast-skills is **always on**. `claude-kan init` installs the hook
unconditionally — there is no opt-out flag and no separate enable step. To
(re)install fast-skills, simply run:

```bash
npx claude-kan init
```

Check status (diagnostic):

```bash
npx claude-kan fast-skills --status
```

---

## Enabling additional skills

Edit `~/.claude/hooks/fast-skills.config.json`:

```json
{
  "enabledSkills": ["kanhelp", "kanboard", "kandoctor"]
}
```

No restart required — the hook reads the config on every invocation.

Remember the trade-offs: colourful skills like `/kanboard` will lose their
colouring when fast-pathed.

---

## Adding a new skill to the fast-path

The only thing required is that a compiled skill at
`<project>/.kanhelper/dist/skills/<name>.js` exists and meets the eligibility
criteria above. To make it default-enabled for new installs, edit
`src/hooks/fast-skills.config.json` in this repo and rebuild. Existing users
who already have a config will keep their customised list.

---

## Escape hatch (diagnostic only)

Fast-skills is designed to be always on. If the hook ever misbehaves and you
need a temporary escape hatch — for example to rule it out while debugging a
prompt flow — you can remove the hook and its settings entry:

```bash
npx claude-kan fast-skills --disable
```

Also remove the config file:

```bash
npx claude-kan fast-skills --disable --purge-config
```

To restore fast-skills after disabling, re-run `npx claude-kan init`. Both
operations are idempotent and leave all unrelated entries in
`~/.claude/settings.json` untouched.

---

## Files managed by fast-skills

| Path                                         | Purpose                         | Owned by install? |
| -------------------------------------------- | ------------------------------- | ----------------- |
| `~/.claude/hooks/fast-skills.sh`             | Hook script                     | Yes (overwritten) |
| `~/.claude/hooks/fast-skills.config.json`    | Enabled-skills list             | Created if missing; preserved on re-install |
| `~/.claude/settings.json`                    | Hook registration entry         | Merged in-place; other keys/entries untouched |

---

## Verifying the hook bypasses the LLM

```bash
# Sanity-check registration + files
npx claude-kan fast-skills --status

# Simulate the hook payload Claude Code would send
printf '%s' '{"prompt":"/kanhelp","cwd":"'"$PWD"'"}' \
  | bash ~/.claude/hooks/fast-skills.sh
```

You should see JSON with `"decision":"block"` and a `"reason"` containing the
plain-text kanhelp output.
