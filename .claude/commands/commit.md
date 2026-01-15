---
description: Commit and push recent work to remote repository
allowed-tools: Bash
argument-hint: <commit message> (e.g., "feat(business): implement profile management")
---

# Commit and Push: $1

Commit all recent work with the message: "$1"

Please perform the following git operations:

1. **Review Changes:**
   - Run `git status` to see all changed files
   - Run `git diff` to review changes

2. **Stage All Changes:**
   ```bash
   git add .
   ```

3. **Create Commit:**
   Use conventional commit format with the provided message and attribution:
   ```bash
   git commit -m "$(cat <<'COMMIT_EOF'
$1

Co-Authored-By: Dunskii andrew@dunskii.com
COMMIT_EOF
)"
   ```

4. **Push to Remote:**
   ```bash
   git push origin $(git branch --show-current)
   ```

5. **Verify Success:**
   ```bash
   git status
   git log -1 --oneline
   ```

**Commit Message Guidelines:**
- Use conventional commit format: `type(scope): description`
- Types: feat, fix, docs, style, refactor, test, chore
- Scopes: business, events, deals, search, auth, api, ui, db, config, alerts, b2b, etc.
- Keep first line under 72 characters
- Add body if needed with detailed explanation

**Examples:**
- `feat(business): implement profile management system`
- `fix(search): resolve Elasticsearch query timeout`
- `docs(api): update deals endpoint documentation`
- `refactor(events): improve calendar component structure`
- `feat(alerts): add emergency notification system`

**Important:**
- DO NOT skip hooks (--no-verify)
- DO NOT force push to main/master
- Only commit when explicitly asked by the user
