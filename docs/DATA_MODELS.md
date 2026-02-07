# DATA_MODELS.md

## 1. Purpose of This Document

This document defines the **core data entities** of Chat-TOB and the **rules governing their relationships**.

It is the **authoritative source of truth** for:
- database schema design
- business logic constraints
- backend behavior

If a concept is not defined here, it **does not exist** in the MVP.

This document intentionally avoids implementation details (SQL, Prisma syntax, APIs).

---

## 2. High-Level Entity Relationships

User
└── Workspace
├── Folder (tree structure)
│ └── Bot
│ └── Message
└── Context


Key ideas:
- **Workspace** is the isolation boundary
- **Folders** define scope
- **Bots** live inside folders
- **Context** is global within a workspace but scoped by folder
- **Messages** belong to bots

---

## 3. Core Models

---

## 3.1 User

### Purpose
Represents a single authenticated individual using the system.

### Core Fields
- id
- email
- name
- created_at

### Relationships
- owns one or more workspaces

### Constraints
- email must be unique
- a user may own zero or more workspaces

### Notes
- There are no roles or permissions in MVP
- The user who creates a workspace is its admin
- Multi-user collaboration is explicitly out of scope

---

## 3.2 Workspace

### Purpose
Top-level container and isolation boundary for all data.

### Core Fields
- id
- name
- owner_id (User)
- created_at

### Relationships
- belongs to one user (owner)
- contains many folders
- contains many bots (indirectly)
- contains many contexts
- contains many messages (indirectly)

### Constraints
- data must never leak across workspaces
- users may create multiple workspaces

### Notes
- No shared ownership in MVP
- No invitations
- Workspace switching is handled at application level

---

## 3.3 Folder

### Purpose
Defines **scope** and **hierarchy**, similar to folders in a code repository.

### Core Fields
- id
- name
- parent_id (nullable, self-referencing)
- workspace_id
- created_at

### Relationships
- belongs to one workspace
- may have one parent folder
- may have many child folders
- may contain multiple bots

### Constraints
- folder hierarchy must not contain cycles
- parent folder must belong to the same workspace
- root folders have `parent_id = null`

### Notes
- Folders do **not** define permissions in MVP
- Folders define **context visibility boundaries**
- Folder depth is unbounded

---

## 3.4 Bot

### Purpose
Represents an AI chatbot configured within a specific folder scope.

### Core Fields
- id
- name
- description
- folder_id
- llm_provider
- created_at

### Relationships
- belongs to exactly one folder
- has many messages
- references many context items (explicit selection)

### Constraints
- a bot must belong to exactly one folder
- multiple bots per folder are allowed
- bot names are unique only within the same folder (soft rule)

### Notes
- Bots do **not** own context
- Bots do **not** automatically inherit context
- Context usage is always explicit
- LLM provider is selected at bot creation

---

## 3.5 Context

### Purpose
Represents reusable knowledge extracted from conversations and shared across bots within scope.

### Core Fields
- id
- title
- summary
- embedding (vector)
- source_bot_id
- source_folder_id
- workspace_id
- created_at

### Relationships
- belongs to one workspace
- created by one bot
- scoped to one folder

### Constraints
- context is immutable (append-only)
- context cannot be edited or deleted in MVP
- context cannot cross workspaces
- context visibility is governed by folder ancestry

### Notes
- Context is created automatically from chats
- Users do not manually create context
- Context is reused by selecting it during bot creation or configuration

---

## 3.6 Message

### Purpose
Represents a single chat message in a conversation with a bot.

### Core Fields
- id
- bot_id
- role (user | assistant | system)
- content
- created_at

### Relationships
- belongs to one bot
- indirectly belongs to one workspace

### Constraints
- messages are immutable
- message order is determined by creation time

### Notes
- Messages are used for:
  - chat history
  - context generation
- System messages are internal and not user-authored

---

## 4. Derived Business Rules (CRITICAL)

These rules must be enforced in backend logic.

### Context Visibility Rule
A context item is visible to a bot if and only if:
- the context’s folder is the same as the bot’s folder, OR
- the context’s folder is an ancestor of the bot’s folder

Contexts from:
- sibling folders
- child folders
- other workspaces  
must never be visible.

---

### Context Usage Rule
- Context is never auto-inherited
- Bots explicitly reference selected context
- Only selected context is injected into prompts

---

### Workspace Isolation Rule
All queries must enforce workspace boundaries explicitly.

No entity may:
- reference another workspace
- be resolved without workspace validation

---

### Folder Integrity Rule
- Folder trees must remain acyclic
- Parent-child relationships must be validated on write

---

## 5. Explicit Non-Models (Out of Scope for MVP)

The following concepts are intentionally NOT modeled:

- Roles or permissions
- Workspace members
- Invitations
- Context versioning
- Context deletion
- Bot deletion cascades
- Tags or labels
- Search indices
- Audit logs

Cursor must not introduce tables or entities for these concepts.

---

## 6. Guiding Principle

> **If a rule is not representable using these models, it is not part of the MVP.**

This document is the foundation for:
- Prisma schema
- API design
- Context resolution logic
- Prompt construction

---

END OF DATA MODELS
