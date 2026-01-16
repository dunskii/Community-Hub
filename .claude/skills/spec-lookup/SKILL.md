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

The specification is organised into 8 parts with 31 sections plus appendices:

### Part 1: Foundation & Architecture (Sections 1-5)
- **Section 1:** Project Overview
- **Section 2:** Platform Configuration Architecture (3-tier config system)
- **Section 3:** Technical Requirements (stack, performance, scalability)
- **Section 4:** Security & Privacy (auth, encryption, APP compliance)
- **Section 5:** Legal & Compliance

### Part 2: Design & User Experience (Sections 6-9)
- **Section 6:** Design Specifications (colours, typography, components)
- **Section 7:** UI States & Components
- **Section 8:** Multilingual Support (10 languages, RTL)
- **Section 9:** Onboarding & User Journeys

### Part 3: Users & Core Entities (Sections 10-13)
- **Section 10:** User Types & Roles (6 roles, permissions matrix)
- **Section 11:** Business Profile Features
- **Section 12:** Community User Features
- **Section 13:** Business Owner Features

### Part 4: Core Functionality (Sections 14-18)
- **Section 14:** Search & Discovery
- **Section 15:** Events & Calendar System
- **Section 16:** Messaging & Communication System
- **Section 17:** Deals & Promotions Hub
- **Section 18:** Reviews & Ratings

### Part 5: Community & Social Features (Sections 19-22)
- **Section 19:** Community Features (noticeboard, groups, history)
- **Section 20:** Social Media Integration
- **Section 21:** Business-to-Business Networking
- **Section 22:** Emergency & Crisis Communication

### Part 6: Administration & Operations (Sections 23-26)
- **Section 23:** Administration & Moderation
- **Section 24:** Content Policies
- **Section 25:** Analytics & Reporting
- **Section 26:** Integration Requirements

### Part 7: Technical Operations (Sections 27-31)
- **Section 27:** Error Handling
- **Section 28:** Data Management
- **Section 29:** Technical Operations
- **Section 30:** Testing & Quality Requirements
- **Section 31:** Operational Procedures

### Part 8: Appendices
- **Appendix A:** Data Models (all entity definitions with fields)
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
- "How should the review system work?" → Read Section 18
- "What are the flash deal rules?" → Read Section 17.2

### Design Specifications
- "What colours should I use?" → Read Section 6.1
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
