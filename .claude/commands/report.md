---
description: Generate accomplishment report and update all documentation
allowed-tools: Task
argument-hint: <feature> (e.g., "business profiles", "events calendar")
---

# Work Accomplishment Report: $1

Generate comprehensive report of completed work and update all project documentation.

**Use the general-purpose agent** to:

1. **Create Detailed Work Report:**
   - Summary of what was accomplished
   - Key features implemented
   - Bugs fixed
   - Database changes made (schema, migrations)
   - API endpoints added/modified (reference Appendix B)
   - Components created/updated
   - Testing coverage added
   - Security enhancements
   - Accessibility improvements
   - Multilingual support added
   - Performance optimizations
   - **Save complete report to:** `md/report/<descriptive-name>.md`

   Generate a descriptive kebab-case filename based on the work accomplished (e.g., `phase-1-foundation-config.md`, `business-profiles-crud-implementation.md`, `events-calendar-rsvp-feature.md`). The filename should make it immediately clear what the report covers without opening the file. Do NOT use generic names like `1.md` or raw `$1` values with spaces.

2. **Update Progress Tracking Files (CRITICAL):**
   - **`PROGRESS.md`** - Update the following sections:
     - Phase progress percentages
     - Phase status tables (mark tasks Complete/In Progress)
     - Weekly status updates section (add new entry or update current)
     - Critical milestones (mark achieved with date)
     - Test coverage metrics (if tests added)
     - Known issues (add any discovered)
     - Decisions log (add any architectural decisions made)
     - Notes for next session
     - Change history (add entry with date and changes)
   - **`TODO.md`** - Update the following:
     - Mark completed items with [x]
     - Update Progress Summary if present
     - Update overall completion percentage

3. **Update Core Documentation:**
   - `CLAUDE.md` - Update "Current Status" section if needed
   - Specification cross-reference - Note any deviations from spec

4. **Update Code Documentation:**
   - Backend README - If backend structure changed
   - Frontend README - If frontend structure changed
   - API documentation for new/modified endpoints
   - Component documentation for new UI components

5. **Update Configuration Files:**
   - `.env.example` - Add any new environment variables
   - `config/platform.json` - Document any new configuration options

6. **Cross-Reference Check:**
   - Ensure PROGRESS.md and TODO.md are aligned
   - Verify phase completion percentages match task completion
   - Ensure all documentation references are consistent
   - Check that linked sections are accurate
   - Verify implementation matches specification

**Deliverables in the report:**
- Comprehensive work summary
- List of ALL files created/modified
- Database schema changes
- API endpoint changes (with spec reference)
- New components created
- Test coverage statistics
- Accessibility compliance status
- Multilingual support status
- Any discovered issues or technical debt
- Recommendations for next steps
- Dependencies on other features

**Progress Tracking Alignment Checklist:**
- [ ] PROGRESS.md phase percentages updated
- [ ] PROGRESS.md weekly status section updated
- [ ] PROGRESS.md milestones updated with dates
- [ ] TODO.md checkboxes marked complete
- [ ] TODO.md progress summary updated
- [ ] All tracking documents show consistent status
- [ ] Specification compliance verified

The report should be thorough enough that another developer can understand exactly what was accomplished without reading all the code.
