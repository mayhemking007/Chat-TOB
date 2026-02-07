# ARCHITECTURE.md

## 1. Overview

Chat-TOB is a SaaS-style web application for managing AI chatbots inside a
VS Code–like workspace. Bots are organized in a repo-style folder structure,
and each bot can explicitly select scoped context to use during conversations.

The system prioritizes:
- explicit context control
- predictable behavior
- familiar UX
- simple, scalable architecture

This document describes **how the system is structured**, not implementation
details or change history.

---

## 2. High-Level System Design

Chat-TOB consists of the following layers:

- Frontend (Next.js)
- Backend API (Node.js + Express)
- Database (PostgreSQL via Neon)
- LLM Integration Layer (OpenAI, abstracted)


Each layer has a clear responsibility and minimal coupling.

---

## 3. Frontend Architecture

### Technology
- Next.js (App Router)
- TypeScript
- Tailwind CSS

### Layout Model (3 Columns)

| Sidebar | Main Chat Area | Right Panel |


#### Sidebar (VS Code–style)
- Folder tree (nested, expandable)
- Bots listed under folders
- Primary navigation mechanism
- No canvas or graph visualization

#### Main Chat Area (ChatGPT-style)
- Focused chat interface
- One active bot at a time
- Persistent message history per bot

#### Right Panel
- Displays bot metadata
- Shows selected context
- Read-only settings in MVP
- Collapsible

### Frontend Principles
- Familiar UX over novelty
- No experimental interactions
- Minimal visual noise
- Deterministic navigation

---

## 4. Backend Architecture

### Technology
- Node.js
- Express
- TypeScript

### Responsibilities
- Authentication
- Workspace isolation
- Folder hierarchy management
- Bot lifecycle
- Context storage and retrieval
- Chat orchestration
- LLM abstraction

### Non-Responsibilities (Explicit)
- RBAC systems
- Billing
- Analytics
- Workflow automation
- Search engines

Backend code must remain readable and avoid premature abstractions.

---

## 5. Workspace Model

- A user may own multiple workspaces
- Workspaces are fully isolated
- Each workspace contains:
  - folders
  - bots
  - context
  - messages

Workspace switching is handled at the application level via a selector.

---

## 6. Folder & Scope Model

Folders form an **n-ary tree** within a workspace.

Folder responsibilities:
- define scope
- group bots
- limit context visibility

Rules:
- folders can be nested infinitely
- folders do not enforce permissions in MVP
- folder hierarchy is the basis for context scoping

---

## 7. Bot Model

- A bot belongs to exactly one folder
- A folder may contain multiple bots
- Bots are differentiated by:
  - name
  - description
  - purpose

Bots:
- do not own context
- do not automatically inherit context
- explicitly reference selected context

---

## 8. Context System

Context represents reusable knowledge extracted from conversations.

### Context Lifecycle
1. User chats with a bot
2. Conversation is segmented
3. A summary is generated via LLM
4. Context is stored globally
5. Context becomes reusable by other bots (within scope)

### Context Properties
- title
- summary
- source bot
- source folder path
- timestamp
- embedding (vector)

### Context Rules
- context is append-only in MVP
- no editing or deletion
- visibility is determined strictly by folder ancestry

---

## 9. Context Visibility Rules

A bot may access context only if:
- the context was created in the same folder
- OR in a parent folder (recursively)

A bot may never access context from:
- sibling folders
- child folders
- other workspaces

These rules must be enforced at the backend level.

---

## 10. Chat & Prompt Construction

Each chat request constructs a prompt in the following order:

1. System prompt
2. Selected context summaries
3. Conversation history
4. Current user message

This ordering is intentional and must remain stable to ensure:
- predictable behavior
- explainability
- easier debugging

---

## 11. LLM Integration Architecture

LLM usage is abstracted behind a provider interface.

### Current Provider
- OpenAI

### Requirements
- No business logic should depend directly on OpenAI APIs
- Adding a new provider must not require refactoring core logic

LLM integration is treated as an infrastructure dependency, not a feature.

---

## 12. Architectural Tradeoffs

Deliberate tradeoffs made for MVP:

- Explicit context selection over automation
- Tree model over DAG
- Append-only context over mutability
- Familiar UX over experimental UI

These choices prioritize clarity and control.

---

## 13. Definition of Architectural Success

The architecture is successful if:
- system behavior is explainable
- new features fit naturally
- Cursor-generated code stays predictable
- the product scales conceptually without rewrites

---

END OF ARCHITECTURE
