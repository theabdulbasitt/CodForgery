# codForge

A TypeScript AI agent that reads and audits code for security vulnerabilities — built from scratch, no agent frameworks, using the Groq API directly.

This project is a deliberate first-principles exercise in agentic AI patterns: tool-calling loops, sandboxed filesystem access, structured output, and resilient API handling. It's preparation groundwork for a larger coordinator/attacker/validator multi-agent security tool.

## What it does

Point it at a local `workspace/` directory and it acts as a security-focused coding assistant that can:

- List and read files inside a sandboxed workspace
- Search code across the entire tree using regex, driven by vulnerability hypotheses (command injection, SQL injection, hardcoded secrets, unsafe deserialization, SSRF, XSS, and more)
- Reason step by step, verifying every claim against actual file contents before reporting it — never trusting a search match as proof
- Hold an interactive, multi-turn conversation about what it finds

## Why this exists

Most "build an AI agent" tutorials wrap everything in a framework, which hides the actual mechanics. This project intentionally avoids that — every tool-calling round trip, every retry, every sandboxing check is hand-written, so the underlying agent loop is fully understood rather than assumed. That understanding is the actual goal; the vulnerability scanner is the vehicle for learning it.

## Architecture

```
src/
├── index.ts          # CLI entry point + the core agent loop
├── prompts.ts         # System prompt — persona, methodology, and behavioral rules
├── groqClient.ts        # Groq API client + retry wrapper for transient failures
└── tools/
    ├── sandbox.ts        # Path resolution + workspace boundary enforcement
    ├── filesystem.ts       # list_files, read_file
    └── search.ts             # search_code (regex search across the workspace tree)

workspace/              # Sandboxed target directory — the agent can only ever read/write here
```

**The agent loop, conceptually:**

1. Your code sends the conversation history + tool schemas to the Groq API
2. The model responds with either a tool call (structured JSON describing what it wants to run) or a final text answer
3. Your code — never the model — executes the requested tool locally and appends the result to the conversation
4. Repeat until the model has enough information and responds with plain text

The model only ever *decides*; your code is the only thing with hands on the filesystem.

**Sandboxing:** every tool that touches a model-supplied path resolves it through `resolveSafePath()`, which rejects any path that would escape the `workspace/` directory — including sibling-directory tricks like `workspace-evil/` matching a naive prefix check. `search_code` is exempt from this check by design, not oversight: it only ever walks *downward* from a hardcoded root, so there's no untrusted path input to validate in the first place.

**Resilience:** Groq API calls are wrapped in a retry helper (`groqClient.ts`) that retries transient failures (e.g. occasional malformed tool-call generations) up to 3 times before failing the turn gracefully, instead of crashing the process.

## Setup

```bash
git clone <this-repo>
cd codForge
npm install
```

Create a `.env` file in the project root:

```
GROQ_API_KEY=your_key_here
```

Get a free key at [console.groq.com](https://console.groq.com).

## Usage

```bash
npm run dev
```

Currently runs a single hardcoded prompt against the sample vulnerable code in `workspace/` (interactive CLI loop coming soon — see Roadmap). Swap the `messages` array in `index.ts` to ask something else, e.g.:

- `"Audit the workspace for security vulnerabilities."`
- `"What's in app.ts? Summarize it."`
- `"Check for command injection risks in src/."`

## Model

Runs on `llama-3.3-70b-versatile` via Groq's free tier — chosen for tool-calling reliability and reasoning quality over raw throughput, since security analysis benefits more from careful reasoning than volume.

## Design decisions worth noting

- **System prompt vs. tool descriptions**: persona and cross-conversation methodology rules (e.g. "a search match is never proof — verify with `read_file` before claiming a vulnerability exists") live in the system prompt, since tool descriptions only carry weight at tool-selection time and don't persist into later reasoning. Tool descriptions are kept to mechanics and syntax reference only. Getting this split wrong caused a real hallucination bug early in development, where the model asserted a SQL injection finding in a file it had never actually read.
- **Structured findings over free text**: vulnerability reports are (or will be) emitted via a `report_finding` tool with an enum'd `vuln_type` and `severity`, not prose — so a downstream validator could consume findings programmatically rather than re-parsing natural language.
- **Confirmation before writes**: any tool that would modify the workspace (once `edit_file`/`write_file` land) requires explicit user confirmation before touching disk — the same "validator gates the attacker" discipline the next project will need between two separate agents.

## Roadmap

- [ ] `edit_file` / `write_file` tools with confirmation prompts
- [ ] `report_finding` tool for structured vulnerability output
- [ ] Interactive CLI loop (persistent conversation, not a single hardcoded prompt)
- [ ] Split into coordinator/attacker/validator multi-agent architecture

## Learning context

Built as hands-on preparation for a larger offensive-security agent project, with a focus on understanding — not just using — agentic patterns: tool-calling protocols, sandboxing discipline, prompt/instruction placement, and graceful failure handling.
