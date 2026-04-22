#!/bin/bash
# claude-kan: fast-skills UserPromptSubmit hook
# -----------------------------------------------------------------------------
# Intercepts selected slash-command prompts (e.g. /kanhelp) and runs the
# corresponding compiled skill locally, emitting its stdout via the hook's
# "block" decision. The LLM call is skipped entirely — zero tokens, instant
# response.
#
# Output contract (Claude Code UserPromptSubmit hook):
#   - To bypass the LLM and display text, print JSON on stdout:
#       {"decision":"block","reason":"<text shown to the user>"}
#     and exit 0.
#   - For any other prompt, exit 0 with no output; the prompt proceeds normally.
#
# Path resolution:
#   - Hook reads `cwd` from the JSON payload on stdin and dispatches to
#     "<cwd>/.kanhelper/dist/skills/<name>.js" — the per-project location that
#     `claude-kan init` installs. No hardcoded user paths.
#
# Config:
#   - Enabled skills are listed in ~/.claude/hooks/fast-skills.config.json
#     { "enabledSkills": ["kanhelp", "kanboard", ...] }
#   - If the config is missing or malformed, defaults to ["kanhelp"].
#   - To be eligible, a skill must be pure static output (no arguments, no
#     mutation). See docs/FAST_SKILLS.md.
#
# ANSI:
#   - The block-reason channel renders plain text, so ANSI escape sequences
#     are stripped from the skill's stdout.

set -uo pipefail

CONFIG_FILE="${CLAUDE_KAN_FAST_SKILLS_CONFIG:-$HOME/.claude/hooks/fast-skills.config.json}"

# Read stdin JSON payload
input=$(cat)

# Extract fields (jq is a standard Claude Code dependency for hook scripts)
if ! command -v jq >/dev/null 2>&1; then
  # Without jq we can't parse the payload; exit silently and let the prompt pass through.
  exit 0
fi

prompt=$(printf '%s' "$input" | jq -r '.prompt // empty')
cwd=$(printf '%s' "$input" | jq -r '.cwd // empty')

# Fall back to the process cwd if the payload did not include one.
if [ -z "$cwd" ]; then
  cwd=$(pwd)
fi

# No prompt → nothing to do.
if [ -z "$prompt" ]; then
  exit 0
fi

# Only slash-command prompts are candidates.
case "$prompt" in
  /*) ;;
  *) exit 0 ;;
esac

# Extract the skill name (first token after the slash, without args).
# e.g. "/kanhelp" → "kanhelp", "/kanhelp extra stuff" → "kanhelp"
first_token=$(printf '%s' "$prompt" | awk '{print $1}')
skill_name=${first_token#/}

# Load enabled-skills list. Default to ["kanhelp"] if config missing/unreadable.
enabled_list=""
if [ -f "$CONFIG_FILE" ]; then
  enabled_list=$(jq -r '.enabledSkills // [] | .[]' "$CONFIG_FILE" 2>/dev/null || echo "")
fi
if [ -z "$enabled_list" ]; then
  enabled_list="kanhelp"
fi

# Check if the skill is in the enabled list.
is_enabled=0
while IFS= read -r entry; do
  [ -z "$entry" ] && continue
  if [ "$entry" = "$skill_name" ]; then
    is_enabled=1
    break
  fi
done <<EOF
$enabled_list
EOF

if [ "$is_enabled" -ne 1 ]; then
  exit 0
fi

# Resolve the compiled skill script under the project-local .kanhelper.
script="$cwd/.kanhelper/dist/skills/$skill_name.js"
if [ ! -f "$script" ]; then
  # Skill file not present in this project — pass through so the LLM (or the
  # normal SKILL.md flow) can handle it.
  exit 0
fi

# Execute the skill. Strip ANSI escape sequences for the plain-text channel.
output=$(cd "$cwd" && node "$script" 2>&1 | sed -E 's/\x1b\[[0-9;]*[a-zA-Z]//g')

# Emit the block decision.
jq -n --arg content "$output" '{decision: "block", reason: $content}'
exit 0
