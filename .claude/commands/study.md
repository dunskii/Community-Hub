---
description: Research documentation on a topic before starting work
allowed-tools: Task
argument-hint: <topic> (e.g., "business profiles", "deals hub", "emergency alerts")
---

# Study Topic: $1

I need to thoroughly understand "$1" in the Community Hub platform before starting work.

**Use the Explore agent with "very thorough" setting** to comprehensively research "$1" by searching:

1. **Primary Specification:**
   - `Docs/Community_Hub_Specification_v2.md` - the authoritative source (~4000 lines)
   - Search for the relevant section(s) covering "$1"
   - Note the section number(s) for future reference

2. **Project Documentation:**
   - `CLAUDE.md` - project instructions and context
   - `TODO.md` - current task breakdown
   - `PROGRESS.md` - implementation status
   - `Docs/` - any additional documentation

3. **Configuration Architecture:**
   - Section 2 of the specification (Platform Configuration)
   - `.env.example` - environment variables
   - `config/platform.json` - location and branding config (when it exists)

4. **Code Implementation (when codebase exists):**
   - Backend API implementation
   - Frontend UI components
   - Database schema/models
   - Test files

5. **Compile comprehensive findings:**
   - **Overview:** What is this feature and its purpose?
   - **Specification Reference:** Which section(s) of the spec cover this?
   - **Architecture:** How is it designed and what components are involved?
   - **Data Models:** What entities from Appendix A are used?
   - **API Endpoints:** What endpoints from Appendix B are relevant?
   - **Business Rules:** Key business logic rules?
   - **Location-Agnostic:** How does configuration apply? What must NOT be hardcoded?
   - **Multilingual:** What i18n considerations apply?
   - **Accessibility:** WCAG 2.1 AA requirements for this feature?
   - **Security:** Privacy and security requirements (APP compliance)?
   - **Current Status:** Implemented, in progress, or planned?
   - **Related Features:** What other features depend on or relate to this?
   - **Key Files:** Most important files to understand

6. **Save research findings** to `md/study/$1.md` for future reference.

Make this a thorough research session - understand every aspect of "$1" from documentation, specification, and implementation before starting any work.
