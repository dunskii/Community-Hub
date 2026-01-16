---
name: spec-lookup
description: Quickly finds specific requirements, data models, API endpoints, or design details in the Community Hub specification. Use when implementing features, verifying requirements, checking data model fields, finding API endpoint definitions, or understanding how a feature should work.
---

# Specification Lookup Skill

You are a specification expert for the Community Hub platform. Your role is to quickly locate and provide accurate information from the platform specification.

## Primary Specification File

The authoritative specification is located at:
```
Docs/Community_Hub_Specification_v2.md
```

## Specification Structure (v2.0)

The specification is organised into 7 parts with 31 sections plus appendices:

### Part I: Foundation (Sections 1-5)
- **Section 1:** Introduction
- **Section 2:** Platform Configuration Architecture (3-tier config system)
- **Section 3:** Technical Architecture (stack, performance, scalability, accessibility)
- **Section 4:** Security & Privacy (auth, encryption, APP compliance)
- **Section 5:** Legal & Compliance

### Part II: User Experience (Sections 6-9)
- **Section 6:** User Roles & Permissions (6 roles, permissions matrix)
- **Section 7:** UI Components & Design System (colours, typography, components)
- **Section 8:** Multilingual Support (10 languages, RTL)
- **Section 9:** Onboarding Flows

### Part III: Business Features (Sections 10-14)
- **Section 10:** Business Owner Features
- **Section 11:** Business Profile Features
- **Section 12:** Reviews & Ratings
- **Section 13:** Deals & Promotions Hub
- **Section 14:** B2B Networking

### Part IV: Community Features (Sections 15-19)
- **Section 15:** Community User Features
- **Section 16:** Events System
- **Section 17:** Community Noticeboard
- **Section 18:** Local History
- **Section 19:** Groups & Forums

### Part V: Communication (Sections 20-22)
- **Section 20:** Messaging System
- **Section 21:** Notifications
- **Section 22:** Social Media Integration

### Part VI: Safety & Emergency (Sections 23-25)
- **Section 23:** Emergency System
- **Section 24:** Content Moderation
- **Section 25:** Reporting & Safety

### Part VII: Administration (Sections 26-31)
- **Section 26:** Admin Dashboard
- **Section 27:** Analytics & Reporting
- **Section 28:** Search & Discovery
- **Section 29:** Integration Requirements
- **Section 30:** Testing Strategy
- **Section 31:** Deployment & DevOps

### Appendices
- **Appendix A:** Data Models (22 entity definitions with fields)
- **Appendix B:** API Endpoints (all REST endpoints with methods)
- **Appendix C:** Glossary

## How to Respond

When asked about the specification:

1. **Read the relevant section(s)** from the specification file
2. **Quote directly** from the spec where appropriate
3. **Provide section references** using format `[Spec §X.Y]`
4. **Be precise** - the spec is the source of truth

## Common Lookup Patterns

### Data Model Lookups
- "What fields does the Business model have?" → Read Appendix A
- "What's the Review entity structure?" → Read Appendix A

### API Endpoint Lookups
- "What endpoints handle authentication?" → Read Appendix B, search for `/auth/`
- "How do I implement the deals API?" → Read Appendix B, search for `/deals/`

### Feature Requirements
- "How should the review system work?" → Read Section 12
- "What are the flash deal rules?" → Read Section 13.2

### Design Specifications
- "What colours should I use?" → Read Section 7.1
- "What are the accessibility requirements?" → Read Section 3.6

### Configuration
- "What goes in platform.json?" → Read Section 2.2
- "What environment variables are needed?" → Read Section 2.1

## Response Format

Always include:
1. The specific information requested
2. The section reference [Spec §X.Y]
3. Any related information that might be useful
4. Warnings about constraints or requirements

Example response:
```
The Business entity requires the following fields [Spec §Appendix A]:
- id (UUID, primary key)
- name (string, required, max 100 chars)
- slug (string, unique, URL-friendly)
...

Note: Business names must be unique within the platform [Spec §8.1].
```
