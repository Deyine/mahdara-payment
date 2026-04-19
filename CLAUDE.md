# Mahdara - Project Guidelines

## Context Folder Usage

The `context/` folder contains structured documentation organized into 6 focused files:

- **00-project-identity.md** - What Mahdara is, business domain, users, problems solved
- **01-architecture.md** - Tech stack, database schema, project structure
- **02-conventions.md** - Design system, UI patterns, code style, naming conventions
- **03-api-contracts.md** - Complete API documentation with endpoints, requests, responses
- **04-boundaries.md** - Frontend ↔ Backend integration patterns and data flow
- **05-operating-rules.md** - Business logic, workflows, and operational constraints
- **06-deployment.md** - Server info, SSH alias, deploy command, deploy.sh gotchas

### Loading Strategy

**DO NOT automatically read all context files at the start of each session.**

Instead, **analyze each user prompt** to determine which context files are relevant, then load them silently before responding — but only if not already loaded in the current session.

Use the Context Selection Guide below to map the task type to the right file(s). Load the minimum needed.

### Context Selection Guide

Suggest appropriate contexts based on the task type:

**For UI/Frontend work** → Load:

- `02-conventions.md` (design system, UI patterns)
- `04-boundaries.md` (frontend integration)

**For API/Backend work** → Load:

- `03-api-contracts.md` (endpoint documentation)
- `05-operating-rules.md` (business logic)

**For Database/Models** → Load:

- `01-architecture.md` (database schema)
- `05-operating-rules.md` (validation rules)

**For New Features** → Load:

- `00-project-identity.md` (project scope and boundaries)
- Relevant domain-specific files based on feature

**For Deployment** → Load:

- `06-deployment.md` (server, SSH, deploy command, gotchas)

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
