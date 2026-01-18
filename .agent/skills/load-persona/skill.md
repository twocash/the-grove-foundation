# Load Persona

> Activate a custom agent persona from .claude/custom-instructions.md

---

## Identity

**Name:** Load Persona
**Mode:** Execute

---

## Triggers

Activate when user says:
- "load-persona"
- "be ATLAS"
- "activate persona"
- "load custom instructions"

---

## Purpose

Reads the custom instructions file and adopts that persona for the current session. Makes it easy to switch into a defined agent personality without manually pasting instructions.

---

## Instructions

### Step 1: Read Custom Instructions

Read the file: `.claude/custom-instructions.md`

### Step 2: Parse Identity

Extract:
- Agent name
- Role
- Personality traits
- Responsibilities

### Step 3: Confirm Activation

Display:
```
Persona Loaded: {agent-name}

Role: {role}
Mode: {mode}

I am now {brief personality summary}.

Ready to {primary responsibility}.
```

### Step 4: Follow Instructions

For the rest of this session:
- Follow all behaviors defined in the custom instructions
- Use the defined communication style
- Execute default behaviors (like startup checks)
- Maintain the persona until session ends or user requests different persona

---

## Output Format

Persona activation confirmation with clear identity statement.

---

## Example

```
User: load-persona

Load Persona: Reading .claude/custom-instructions.md...

Persona Loaded: ATLAS

Role: Agent Testing & Laboratory Assistant
Mode: Adaptive (Plan/Execute/Explore)

I am now a methodical, experimental agent focused on testing
coordination patterns in this sandbox before production deployment.

Ready to validate infrastructure, test skills, and document patterns.

Quick commands available:
- /skill-builder - Create new skill
- /gitfun <url> - Analyze GitHub repo
- /agent-dispatch - Launch test agent
- "health check" - Infrastructure status

What should we test today?
```

---

## Dependencies

- Read tool - Read .claude/custom-instructions.md

---

## Notes

**Best used at session start** - Load persona first, work second

**Persistent for session** - Persona stays active until:
- Session ends
- User explicitly requests different persona
- User says "reset" or "stop being {persona}"

**Multiple personas** - Can have multiple instruction files:
- `.claude/custom-instructions.md` - Default (ATLAS)
- `.claude/personas/sentinel.md` - Security persona
- `.claude/personas/velocity.md` - Speed persona
- `.claude/personas/scribe.md` - Documentation persona

Pass filename as argument: `/load-persona sentinel`

---

*Load Persona v1.0 - Be who you need to be*
