# VISION.md

## Chat TOB
Bot Workspace  
A VS Code–style workspace for AI chatbots with scoped, reusable context.

---

## 1. High-Level Vision

This project is a **SaaS-style MVP** that allows users to create and manage AI chatbots (“bots”) inside a **repo-like folder structure**, similar to how code is organized in VS Code.

The core idea:
- **Folders define scope**
- **Multiple bots can live inside folders**
- **Context is global, scoped, and explicitly selected**
- **Bots reuse organizational knowledge without hidden inheritance**

The UI combines:
- **VS Code–style sidebar (structure & navigation)**
- **ChatGPT-style main chat interface**
- **A right-side panel for bot context & settings**

This is **not** a ChatGPT clone.  
This is **context infrastructure for AI chatbots**.

---

## 2. What This Project Is (And Is Not)

### This project IS:
- A multi-workspace SaaS application
- A system to manage many chatbots in structured scopes
- A knowledge accumulation layer for organizations and individuals
- A developer-friendly, explainable AI interface

### This project IS NOT:
- An agent automation framework
- A workflow engine
- A multi-user enterprise IAM system (for MVP)
- A DAG visualization tool
- A no-code AI builder

Cursor must not introduce features outside the defined MVP scope.

---

## 3. Workspace Model (UPDATED)

### Workspace
- A user can create **multiple workspaces**, even in MVP.
- Each workspace is isolated (folders, bots, context).
- User is **admin** of all workspaces they create.

### Login Behavior
- On login:
  - If user has **no workspaces** → show “Create workspace to get started”
  - If user has workspaces → redirect to last active workspace

### Workspace Switcher
- A dropdown (similar to GitHub org switcher)
- Allows switching between workspaces
- No invites or shared ownership in MVP

---

## 4. Core Mental Model

### Folder
- Folders form an **n-ary tree**
- Folders represent **scope**
- Folders can be nested infinitely
- Folders can contain:
  - subfolders
  - **multiple bots**

### Bot
- A bot belongs to **exactly one folder**
- A folder can contain **multiple bots**
- Bots are differentiated by:
  - name
  - description
  - purpose (e.g. SOP, flow, code)
- Bots do **not** own context
- Bots **reference context explicitly**

### Context
- Context is generated automatically from chats
- Context is stored globally within a workspace
- Context is scoped by folder path
- Context is append-only in MVP

---

## 5. Context Visibility & Inheritance Rules

These rules are strict and must not be violated:

1. A bot can only access context created in:
   - its own folder
   - parent folders (recursively up to workspace root)

2. A bot can never access context from:
   - sibling folders
   - child folders
   - other workspaces

3. Context inheritance is **explicit**:
   - When creating a bot, the user must choose context manually
   - There is no auto-inheritance in MVP

4. At chat time:
   - Only selected context is injected into the prompt

---

## 6. Global Context Manager

The Context Manager is a **core system component**.

### Context properties:
- title
- summary
- source bot
- source folder path
- timestamp
- embedding (vector)

### Behavior:
- Context is created automatically from chat conversations
- Users do not manually write or edit context
- Context is immutable (append-only)
- No deletion or editing in MVP

### Visibility:
- Context is visible only if its folder path is an ancestor of the bot’s folder

---

## 7. Bot Creation Flow (UPDATED)

Bot creation is a guided process.

### Step 1: Bot Basics
- Bot name
- Bot description
- Bot purpose (free-text, optional)
- Bot type:
  - Fresh bot (no context)
  - Context-aware bot

### Step 2: Context Selection (for context-aware bots)
- User sees a list of context items
- Context list is filtered by folder ancestry
- User explicitly selects which context to attach

There must be:
- no automatic selection
- no hidden context usage

---

## 8. Chat System & UI LAYOUT (UPDATED)

### UI Layout (3-column design)

| Sidebar (Folders & Bots) | Chat Area | Right Panel |

#### Left Sidebar (VS Code–style)
- Folder tree
- Bots listed under folders
- Expand/collapse folders
- Clicking a bot opens chat

#### Main Chat Area (ChatGPT-style)
- Large, focused chat interface
- Persistent conversation per bot
- Input at bottom
- Streaming responses optional

#### Right Panel (Bot Context & Settings)
- Shows:
  - selected context for the bot
  - context sources (folder paths)
  - basic bot settings (read-only in MVP)
- No advanced editing in MVP
- Panel can be collapsible

---

## 9. Chat Behavior & Prompt Construction

### Chat principles:
- Each bot has its own persistent chat history
- Messages are stored per bot
- Context is injected explicitly

### Prompt structure:
1. System prompt
2. Selected context summaries
3. Chat history
4. Current user message

### Transparency:
- UI must indicate which context is being used
- Users should never wonder *why* a bot answered something

---

## 10. LLM Architecture (Future-Proof)

### MVP:
- OpenAI is the only active provider

### Requirement:
- LLM logic must be abstracted behind a provider interface
- Adding Anthropic / Gemini later must not require refactors

Cursor must not hardcode OpenAI logic inside feature code.

---

## 11. Frontend Philosophy

- Familiar UX over novelty
- No canvas-based graphs
- No experimental interactions
- Predictable layouts

Think:
- VS Code sidebar
- ChatGPT main window
- Notion-like calm UI

---

## 12. Backend Philosophy

Backend must:
- remain simple
- be readable
- avoid premature abstraction

Explicit non-goals:
- RBAC
- context editing
- analytics
- search
- billing
- workflow engines

---

## 13. MVP Constraints (VERY IMPORTANT)

Cursor must respect the following constraints:

- Do not introduce new entities without approval
- Do not refactor unrelated files
- Do not add libraries unless explicitly requested
- Do not introduce advanced patterns (CQRS, events, etc.)
- Prefer clarity over cleverness

---

## 14. Definition of MVP Success

The MVP is successful if:

- A user can create multiple workspaces
- A user can structure folders like a repo
- Multiple bots can exist in a folder
- Bots explicitly select context from parent folders
- Chat creates reusable knowledge automatically
- UI feels intuitive without explanation

---

## 15. Guiding Principle

> **Explicit context + familiar UX beats magical AI behavior**

Every decision should prioritize:
- clarity
- control
- trust

---

END OF VISION
