---
description: Comprehensive code review for quality, security, and completeness
allowed-tools: Task
argument-hint: <topic> (e.g., "business profiles", "events calendar")
---

# Code Review: $1

Perform comprehensive code review of "$1" to ensure quality, security, and completeness.

**Use the general-purpose agent** to review:

1. **Coding Standards Compliance:**
   - TypeScript strict mode compliance
   - Proper error handling and try-catch blocks
   - Component architecture and design patterns
   - Code organization and structure
   - Naming conventions (camelCase, PascalCase, etc.)
   - Proper type definitions (no 'any' types)
   - Mobile-first responsive patterns

2. **Security Verification (CRITICAL):**
   - **Australian Privacy Principles (APP) compliance**
   - Input validation and sanitization on all endpoints
   - Protection against XSS, SQL injection, CSRF
   - Proper authentication/authorization checks (JWT)
   - No hardcoded secrets or credentials
   - Secure error messages (no data leakage)
   - Rate limiting implemented where required
   - Message spam prevention (max 10 new conversations/day)
   - bcrypt password hashing (cost factor 12+)
   - TLS 1.3 / AES-256 encryption considerations

3. **Specification Compliance:**
   - Review `Docs/Community_Hub_Specification_v2.md`
   - Verify implementation matches specification requirements
   - Check data models match Appendix A
   - Verify API endpoints match Appendix B
   - Ensure all required fields and validations are present

4. **Plan File Verification:**
   - Review `md/plan/$1.md` if it exists
   - Verify all planned tasks were completed
   - Check task dependencies were followed in correct sequence
   - Confirm all success criteria were met
   - Ensure all phases completed

5. **Study File Cross-Reference:**
   - Review `md/study/$1.md` if it exists
   - Verify all documented requirements are implemented
   - Ensure architecture matches what was researched
   - Check for gaps in implementation vs documentation

6. **Location-Agnostic Verification:**
   - Verify NO hardcoded location data (suburb names, coordinates, etc.)
   - All location values from platform.json or database
   - Configuration properly loaded and used
   - Multi-deployment ready

7. **Multilingual & Accessibility:**
   - i18n properly implemented (10 languages)
   - RTL support for Arabic and Urdu
   - WCAG 2.1 AA compliance
   - 44px minimum touch targets
   - Proper ARIA labels and roles
   - Keyboard navigation support

8. **Testing Coverage:**
   - Unit tests for critical functionality
   - Integration tests for API endpoints
   - Accessibility tests
   - Edge cases handled
   - Error scenarios tested

9. **Performance & Code Quality:**
   - Performance targets met (< 3s load, < 200ms API, Lighthouse > 80)
   - Database query optimization
   - Proper use of React hooks / Vue composition
   - Component reusability
   - Mobile responsiveness

10. **Design System Compliance:**
    - Colors from configuration (default: Teal #2C5F7C, Orange #E67E22, Gold #F39C12)
    - Typography (Montserrat headings, Open Sans body)
    - Alert colors (Red critical, Orange warning, Yellow advisory, Blue info)
    - Responsive breakpoints (Mobile < 768px, Tablet 768-1199px, Desktop >= 1200px)

**Save the complete review to:** `md/review/$1.md`

The review should identify:
- Critical issues that must be fixed
- Security vulnerabilities
- Specification deviations
- Accessibility violations
- Coding standard violations
- Missing tests or documentation
- Recommendations for improvements
