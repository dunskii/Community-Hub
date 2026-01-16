---
description: Generate detailed implementation plan with actionable todos
allowed-tools: Task
argument-hint: <task> (e.g., "business profiles", "events calendar", "deals hub")
---

# Implementation Plan: $1

Generate a comprehensive implementation plan for "$1".

**Use the Plan agent** to create a detailed plan by:

1. **Analyze Task Requirements:**
   - Review `Docs/Community_Hub_Specification_v2.md` for requirements
   - Identify the relevant specification section(s)
   - Review CLAUDE.md guidelines and configuration requirements
   - Identify dependencies and prerequisites

2. **Break Down Into Phases:**
   - **Phase 1: Configuration** - platform.json settings, environment variables
   - **Phase 2: Database Layer** - PostgreSQL schema, migrations, Elasticsearch indices
   - **Phase 3: API Layer** - RESTful endpoints with proper validation (per Appendix B)
   - **Phase 4: Service Layer** - Business logic and utilities
   - **Phase 5: Frontend Layer** - React/Vue components, mobile-first responsive
   - **Phase 6: Integration** - Connect all layers, test data flow
   - **Phase 7: Multilingual** - i18n setup for 10 languages including RTL
   - **Phase 8: Testing** - Unit tests, integration tests, accessibility tests
   - **Phase 9: Documentation** - Update docs and API documentation

3. **Create Structured Todo Breakdown:**
   - Specific actionable tasks for each phase
   - File paths and code locations
   - Task dependencies and sequence
   - Success criteria for each task
   - Which specialized agent should handle each task

4. **Location-Agnostic Considerations:**
   - Identify all values that must come from configuration
   - Plan for platform.json structure
   - Ensure no hardcoded suburb names, coordinates, or location data
   - Consider multi-deployment scenarios

5. **Security & Compliance:**
   - Australian Privacy Principles (APP) requirements
   - Input validation for all endpoints
   - Rate limiting requirements
   - OWASP top 10 protection
   - Message spam prevention

6. **Accessibility & Performance:**
   - WCAG 2.1 AA compliance checkpoints
   - Performance targets (< 3s load, < 200ms API)
   - Mobile-first responsive design
   - PWA requirements

7. **Risk Assessment:**
   - Potential challenges and complexity
   - Security considerations
   - Performance implications
   - Integration points with existing features

8. **Integration Points:**
   - How this connects with existing features
   - API contract requirements
   - Shared components and utilities
   - Database relationships (per Appendix A)

**Save the complete plan to:** `md/plan/$1.md`

The plan should be detailed enough that any developer can follow it step-by-step to implement the feature correctly.
