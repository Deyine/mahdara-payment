# Glamova - Project Guidelines

## Context Folder Usage

The `context/` folder contains structured documentation organized into 7 focused files:

- **00-project-identity.md** - What Glamova is, business domain, users, problems solved
- **01-architecture.md** - Tech stack, database schema, project structure, deployment
- **02-conventions.md** - Design system, UI patterns, code style, naming conventions
- **03-api-contracts.md** - Complete API documentation with endpoints, requests, responses
- **04-boundaries.md** - Frontend ↔ Backend integration patterns and data flow
- **05-operating-rules.md** - Business logic, workflows, and operational constraints
- **06-time-tracking-frontend.md** - Time tracking standalone app (time-tracking-client/)

### Loading Strategy

**DO NOT automatically read all context files at the start of each session.**

Instead, follow this approach:

1. **At the start of a new session**, ASK the user which context file(s) they need:
   - "Which context should I load for this task? (00-identity, 01-architecture, 02-conventions, 03-api, 04-boundaries, 05-rules, 06-time-tracking-frontend)"

2. **Wait for the user to specify** the relevant file(s) based on their task

3. **Only load what's needed** to keep the session focused and avoid information overload

### Context Selection Guide

Suggest appropriate contexts based on the task type:

**For UI/Frontend work** → Load:

- `02-conventions.md` (design system, UI patterns)
- `04-boundaries.md` (frontend integration)

**For API/Backend work** → Load:

- `03-api-contracts.md` (endpoint documentation)
- `05-operating-rules.md` (business logic)

**For Time Tracking work** (any feature area) → Also load:

- `06-time-tracking-frontend.md` (standalone app structure, routing, permissions)

**For Database/Models** → Load:

- `01-architecture.md` (database schema)
- `05-operating-rules.md` (validation rules)

**For New Features** → Load:

- `00-project-identity.md` (project scope and boundaries)
- Relevant domain-specific files based on feature

**For Bug Fixes** → Load only what's relevant to the bug area

**For General Questions** → Ask user which context would help

### Updating Context Files

When the user asks you to update context documentation:

**DO document**:

- API endpoints, parameters, and response formats
- Function signatures and their purpose
- Business rules and validation logic
- UI patterns and component structures
- Data flow and integration patterns
- if the session implies that some stuff are not relevent anymore, remove them from the context

**DON'T document**:

- Branch names (they change frequently)
- Specific line numbers (code shifts)
- Temporary debugging code
- One-off implementation details
- Personal notes or TODOs

**Where to document**:

- Technical patterns → `02-conventions.md`
- API changes → `03-api-contracts.md`
- Business logic → `05-operating-rules.md`
- Architecture changes → `01-architecture.md`
- Integration patterns → `04-boundaries.md`

Keep documentation concise and focused on what you'll need to understand the feature in future sessions. If I ask you to complete context and there is nothing new, so just don't do it.
