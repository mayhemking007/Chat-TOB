# RULES.md

This file defines **strict rules** for how code must be written and modified
in this repository.

These rules exist to:
- prevent scope creep
- keep architecture coherent
- keep Cursor under control
- maintain long-term clarity

All contributors (human or AI) must follow these rules.

---

## 1. Scope Discipline

- Only build features explicitly defined in `VISION.md`
- If a feature is not mentioned, it is out of scope
- Do not “helpfully” add features

If unsure, STOP and ask.

---

## 2. Change Granularity

- Make small, local changes only
- Do not modify unrelated files
- Do not refactor code unless explicitly requested

Large changes must be broken into multiple small steps.

---

## 3. File Ownership Rules

- `VISION.md` defines *why*
- `ARCHITECTURE.md` defines *how*
- `DATA_MODELS.md` defines *what*

Cursor:
- may read all of them
- may suggest edits
- must not rewrite them wholesale

---

## 4. Dependency Rules

- Do not add libraries unless explicitly requested
- Prefer existing tools and simple solutions
- Avoid introducing abstraction layers prematurely

No new dependency is “small” by default.

---

## 5. Backend Rules

- Controllers must remain thin
- Business logic must live in services
- No LLM logic inside route handlers
- No OpenAI calls outside the LLM abstraction layer

Clarity > cleverness.

---

## 6. Frontend Rules

- No canvas or graph-based UI
- Sidebar is the primary navigation
- Chat is the primary interaction
- Right panel is secondary and read-only in MVP

Do not introduce novel UI patterns.

---

## 7. Context Rules (NON-NEGOTIABLE)

- Context is append-only
- Context is never auto-inherited
- Context is always explicitly selected
- Context visibility follows folder ancestry only

Violating these rules breaks the core product idea.

---

## 8. LLM Rules

- OpenAI is the only active provider in MVP
- Provider logic must be abstracted
- Prompt construction must be deterministic
- No “magic” prompt changes

LLMs are infrastructure, not product logic.

---

## 9. Cursor Usage Rules

Cursor must:
- explain changes when asked
- operate on one feature at a time
- respect existing architecture

Cursor must NOT:
- refactor the entire codebase
- introduce patterns not discussed
- rename files arbitrarily
- add comments explaining obvious code

---

## 10. Git Discipline

- Commit frequently
- One logical change per commit
- Commit messages should describe intent, not files

Git is the source of truth for change history.

---

## 11. When to Stop

If a change:
- adds complexity without clear value
- introduces new concepts
- breaks mental models

STOP and reassess.

---

## Guiding Rule

> **If the system becomes harder to explain, the change is wrong.**

---

END OF RULES
