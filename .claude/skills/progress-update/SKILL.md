---
name: progress-update
description: Updates TODO.md and PROGRESS.md files after completing development tasks. Use when finishing tasks to keep project tracking accurate and stakeholders informed.
---

# Progress Update Skill

You are a project tracking expert for the Community Hub platform. Your role is to help maintain accurate development progress in the TODO.md and PROGRESS.md files after tasks are completed.

## File Locations

- **TODO.md** - Development task checklist (root directory)
- **PROGRESS.md** - Progress tracker with metrics and status (root directory)

## TODO.md Format

### Task Status Markers

```markdown
- [ ] Not started
- [x] Completed
- [~] In progress (manually marked)
- [BLOCKED] Has dependencies
```

### Task Structure

```markdown
## Phase X: Phase Name

### X.X Section Name

#### Subsection
- [ ] Task description [Spec §X.Y]
- [x] Completed task
- [~] Task in progress
```

## Updating TODO.md

When a task is completed:

1. **Find the exact task** in TODO.md
2. **Change `[ ]` to `[x]`**
3. **Do NOT modify task text** unless correcting an error
4. **Keep spec references intact**

### Example Update

Before:
```markdown
#### Core Auth Endpoints
- [ ] POST /auth/register - User registration
- [ ] POST /auth/login - User login
- [ ] POST /auth/logout - User logout
```

After (login implemented):
```markdown
#### Core Auth Endpoints
- [ ] POST /auth/register - User registration
- [x] POST /auth/login - User login
- [ ] POST /auth/logout - User logout
```

### Marking In Progress

For tasks that span multiple sessions:

```markdown
- [~] POST /auth/register - User registration
```

## PROGRESS.md Format

### Quick Status Table

```markdown
## Quick Status

| Phase | Status | Tasks | Progress |
|-------|--------|-------|----------|
| Phase 1: Foundation | In Progress | 47 | 15% |
| Phase 2: Auth | Not Started | 33 | 0% |
```

### Phase Progress Details

```markdown
### Phase 1: Foundation & Core Infrastructure
**Status:** In Progress
**Progress:** 7/47 tasks (15%)

#### Completed
- Set up monorepo structure
- Configure Git repository and branching strategy

#### In Progress
- Configure CI/CD pipelines

#### Blockers
- Awaiting cloud provider decision
```

### Current Sprint

```markdown
## Current Sprint

**Sprint:** Sprint 1
**Sprint Goal:** Complete development environment setup

### Sprint Tasks
| Task | Assignee | Status | Notes |
|------|----------|--------|-------|
| Set up monorepo | Dev | Complete | Used Turborepo |
| Configure CI/CD | Dev | In Progress | GitHub Actions |
```

## Updating PROGRESS.md

When tasks are completed:

### 1. Update Phase Progress

```markdown
### Phase 1: Foundation & Core Infrastructure
**Status:** In Progress
**Progress:** 8/47 tasks (17%)  <!-- Updated from 7/47 -->
```

### 2. Move Task to Completed Section

```markdown
#### Completed
- Set up monorepo structure
- Configure Git repository and branching strategy
- Configure CI/CD pipelines (GitHub Actions)  <!-- Newly added -->

#### In Progress
- Set up development environment (Docker)  <!-- Moved here -->
```

### 3. Update Quick Status Table

Recalculate percentages:
```markdown
| Phase 1: Foundation | In Progress | 47 | 17% |  <!-- Updated -->
```

### 4. Update Overall Progress

```markdown
**Overall Project Progress: 1.3% (8/624 tasks)**
```

### 5. Update Sprint Status (if applicable)

```markdown
| Configure CI/CD | Dev | Complete | GitHub Actions |  <!-- Updated -->
```

### 6. Add Decision Log Entry (for significant decisions)

```markdown
## Decision Log

| Date | Decision | Rationale | Decided By |
|------|----------|-----------|------------|
| 15 Jan 2026 | Use GitHub Actions for CI/CD | Free tier, good integration | Dev Team |
```

## Progress Calculation

### Per-Phase Progress

```
Progress % = (Completed Tasks / Total Tasks) × 100
```

### Overall Progress

```
Overall % = (Total Completed Tasks / 624) × 100
```

### Phase Status Rules

- **Not Started:** 0 tasks completed
- **In Progress:** 1+ tasks completed, < 100%
- **Complete:** 100% tasks completed
- **Blocked:** Has dependencies not yet resolved

## Milestone Updates

When a milestone is achieved:

```markdown
### MVP Milestones
- [x] **MVP 1:** Static business directory (Phases 1-4)  <!-- Mark complete -->
  - Foundation, auth, design system, business profiles
  - Completed: 20 Jan 2026  <!-- Add completion date -->
```

## Quality Metrics Updates

After implementing features, update relevant metrics:

```markdown
### Quality Metrics
| Metric | Target | Current |
|--------|--------|---------|
| Test Coverage | > 80% | 82% |  <!-- Update after tests -->
| Lighthouse Performance | > 80 | 85 |  <!-- Update after audit -->
```

## Changelog Entry

Add entry for significant updates:

```markdown
## Changelog

### [Date]
- Completed Phase 1.1 development environment setup
- CI/CD pipeline operational with GitHub Actions
- Added 8 new unit tests
```

## Automation Helpers

### Task Count Script

```bash
# Count completed tasks in TODO.md
grep -c "\[x\]" TODO.md

# Count total tasks
grep -c "\[ \]\|\[x\]\|\[~\]" TODO.md
```

### Progress Calculation

```javascript
// Helper to calculate progress
function calculateProgress(completed, total) {
  return Math.round((completed / total) * 100);
}

// Phase task counts from spec
const phaseTasks = {
  'Phase 1': 47,
  'Phase 2': 33,
  'Phase 3': 40,
  // ... etc
};
```

## Update Checklist

When updating progress:

- [ ] Mark task complete in TODO.md
- [ ] Update phase progress count and percentage
- [ ] Move task to "Completed" section in PROGRESS.md
- [ ] Update Quick Status table
- [ ] Update Overall Project Progress
- [ ] Update sprint task status if applicable
- [ ] Add decision log entry if significant decision made
- [ ] Add changelog entry for major milestones
- [ ] Verify task counts are accurate

## Example Full Update

### Task Completed: "Set up PostgreSQL database"

**TODO.md change:**
```markdown
- [x] Set up PostgreSQL database  <!-- Changed from [ ] -->
```

**PROGRESS.md changes:**

1. Phase progress:
```markdown
**Progress:** 8/47 tasks (17%)  <!-- Was 7/47 (15%) -->
```

2. Completed section:
```markdown
#### Completed
- Set up monorepo structure
- Configure Git repository
- Configure CI/CD pipelines
- Set up PostgreSQL database  <!-- Added -->
```

3. Quick Status:
```markdown
| Phase 1: Foundation | In Progress | 47 | 17% |
```

4. Overall:
```markdown
**Overall Project Progress: 1.3% (8/624 tasks)**
```

5. Sprint (if applicable):
```markdown
| Set up PostgreSQL | Dev | Complete | Docker Compose |
```

6. Changelog:
```markdown
### 15 January 2026
- PostgreSQL database configured with Docker Compose
- Initial schema migration created
```
