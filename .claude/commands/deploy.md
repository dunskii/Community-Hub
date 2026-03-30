---
description: Deploy to pilot server at http://170.64.209.76
allowed-tools: Bash
argument-hint: [--test] [--git] (e.g., "/deploy --test" or "/deploy --git")
---

# Deploy to Pilot Server

Build locally and deploy to pilot server at http://170.64.209.76 via SCP.

## Usage

```bash
/deploy                    # Build locally and deploy via SCP (default)
/deploy --test             # Run tests before building and deploying
/deploy --git              # Deploy via GitHub Actions (PR workflow)
```

## What This Command Does

### Default Mode (Local Build + SCP)

1. **Optional: Run Tests** (if --test flag)
   - Run backend and frontend test suites
   - Abort deployment if tests fail

2. **Backup Production Database**
   - Create timestamped pg_dump on server
   - Download backup locally
   - Keep last 10 backups

3. **Build Applications Locally**
   - Build shared package (TypeScript)
   - Build backend (TypeScript)
   - Build frontend (Vite production build)
   - Generate Prisma client

4. **User Confirmation**
   - Prompt for deployment confirmation
   - Show pending migrations if any
   - Require explicit "yes" to proceed

5. **Deploy via SCP**
   - Clean stale frontend assets on server
   - Upload built backend, frontend, and Prisma files
   - Upload pnpm workspace files

6. **Update Server**
   - SSH to server (170.64.209.76)
   - Install production dependencies
   - Generate Prisma client
   - Run database migrations
   - Copy Prisma client to dist
   - Reload Nginx
   - Restart PM2 process

7. **Verification**
   - Test health endpoint
   - Check PM2 process status

## Environment Details

- **Server**: 170.64.209.76 (DigitalOcean, Sydney)
- **Directory**: /var/www/community-hub
- **Branch**: main
- **Backend Port**: 5000
- **PM2 Process**: community-hub-api
- **PM2 Runtime**: tsx (src/index.ts directly, not dist/)
- **Database**: community_hub (PostgreSQL 17)
- **Redis**: localhost:6379/0
- **User**: deploy
- **Package Manager**: pnpm (monorepo workspaces)
- **Production URL**: http://170.64.209.76 (IP-only, no domain yet)

## Instructions for Claude

### Parse Flags

Check which deployment mode to use:
- No flags or `--test`: Use SCP deployment (default)
- `--git`: Use GitHub Actions PR workflow

### Default Mode (Local Build + SCP)

1. **Backup Production Database (MANDATORY)**:
   ```bash
   echo ""
   echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
   echo "BACKING UP PRODUCTION DATABASE"
   echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
   echo ""

   BACKUP_TIMESTAMP=$(date +%Y-%m-%d-%H%M%S)
   BACKUP_DIR="backups/production"
   BACKUP_FILE="community-hub-${BACKUP_TIMESTAMP}.sql"

   mkdir -p "$BACKUP_DIR"

   echo "Creating database backup on server..."
   ssh deploy@170.64.209.76 "
     mkdir -p /home/deploy/backups
     pg_dump -h localhost -U community_hub community_hub > /home/deploy/backups/community-hub-${BACKUP_TIMESTAMP}.sql
     echo 'Backup created'
     ls -lh /home/deploy/backups/community-hub-${BACKUP_TIMESTAMP}.sql
   "

   echo ""
   echo "Downloading backup to local machine..."
   scp deploy@170.64.209.76:/home/deploy/backups/community-hub-${BACKUP_TIMESTAMP}.sql "$BACKUP_DIR/$BACKUP_FILE"

   if [ -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
     BACKUP_SIZE=$(ls -lh "$BACKUP_DIR/$BACKUP_FILE" | awk '{print $5}')
     echo ""
     echo "Database backup complete!"
     echo "   Local: $BACKUP_DIR/$BACKUP_FILE"
     echo "   Size: $BACKUP_SIZE"
     echo ""
   else
     echo ""
     echo "ERROR: Backup verification failed! Aborting deployment."
     echo ""
     exit 1
   fi

   # Keep last 10 backups
   ssh deploy@170.64.209.76 "
     cd /home/deploy/backups
     ls -t community-hub-*.sql | tail -n +11 | xargs -r rm
   "
   cd "$BACKUP_DIR"
   ls -t community-hub-*.sql 2>/dev/null | tail -n +11 | xargs -r rm 2>/dev/null || true
   cd - > /dev/null
   ```

2. **Optional: Run Tests** (if --test flag):
   ```bash
   echo "Running tests..."
   pnpm test
   TEST_EXIT_CODE=$?

   if [ $TEST_EXIT_CODE -ne 0 ]; then
     echo ""
     echo "Tests failed! Fix tests before deploying."
     echo ""
     exit 1
   fi
   echo "All tests passed"
   ```

3. **Build Applications Locally**:
   ```bash
   echo "Building shared package..."
   cd packages/shared
   pnpm run build
   cd ../..
   echo "Shared build complete"

   echo "Building backend..."
   cd packages/backend
   pnpm run build
   cd ../..
   echo "Backend build complete"

   echo "Building frontend..."
   cd packages/frontend
   pnpm run build
   cd ../..
   echo "Frontend build complete"
   ```

4. **Check for Pending Migrations**:
   ```bash
   echo "Checking for pending database migrations..."

   cd packages/backend
   MIGRATION_STATUS=$(npx prisma migrate status 2>&1 || true)
   cd ../..

   PENDING_MIGRATIONS=$(echo "$MIGRATION_STATUS" | grep -A 100 "Following migration" | grep "^\s*[0-9]" || true)

   if [ -n "$PENDING_MIGRATIONS" ]; then
     echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
     echo "PENDING DATABASE MIGRATIONS DETECTED"
     echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
     echo ""
     echo "The following migrations will be applied:"
     echo "$PENDING_MIGRATIONS"
     echo ""
     echo "SAFETY CHECKS - Verify migrations:"
     echo "  - Do NOT drop any tables"
     echo "  - Do NOT drop any columns"
     echo "  - Do NOT modify existing data"
     echo "  - Only ADD new tables, columns, or indexes"
     echo ""
     echo "Review files in: packages/backend/prisma/migrations/"
     echo ""
     read -p "Have you reviewed the migrations and confirmed they are SAFE? (yes/no): " MIGRATION_CONFIRM
     echo ""

     if [ "$MIGRATION_CONFIRM" != "yes" ]; then
       echo "Deployment cancelled - migrations not confirmed."
       echo "Backup saved at: $BACKUP_DIR/$BACKUP_FILE"
       exit 1
     fi
     echo "Migration safety confirmed"
   else
     echo "No pending migrations"
   fi
   ```

5. **User Confirmation (REQUIRED)**:
   ```bash
   echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
   echo "DEPLOYMENT CONFIRMATION"
   echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
   echo ""
   echo "Deploying to:"
   echo "  Server: 170.64.209.76"
   echo "  Directory: /var/www/community-hub"
   echo "  URL: http://170.64.209.76"
   echo "  Process: community-hub-api"
   echo "  Backup: ${BACKUP_FILE}"
   echo ""
   echo "This will:"
   echo "  - Upload built shared, backend, and frontend packages"
   echo "  - Install production dependencies"
   if [ -n "$PENDING_MIGRATIONS" ]; then
     echo "  - Run database migrations (REVIEWED AND CONFIRMED SAFE)"
   else
     echo "  - Run database migrations (none pending)"
   fi
   echo "  - Restart PM2 process"
   echo ""
   echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
   echo ""
   read -p "Proceed with deployment? (yes/no): " CONFIRM
   echo ""

   if [ "$CONFIRM" != "yes" ]; then
     echo "Deployment cancelled."
     echo "Backup saved at: $BACKUP_DIR/$BACKUP_FILE"
     exit 1
   fi
   ```

6. **Clean Stale Assets on Server**:
   ```bash
   # Remove old frontend assets and service worker files
   ssh deploy@170.64.209.76 "rm -rf /var/www/community-hub/packages/frontend/dist/assets/* && \
     rm -f /var/www/community-hub/packages/frontend/dist/sw.js* && \
     rm -f /var/www/community-hub/packages/frontend/dist/workbox-*.js*"
   ```
   - **CRITICAL**: Must run BEFORE uploading new files
   - Vite hashes filenames per build, so old bundles accumulate if not cleaned

7. **Deploy via SCP**:
   ```bash
   echo "Uploading files to server..."

   # Upload shared package build
   scp -r packages/shared/dist deploy@170.64.209.76:/var/www/community-hub/packages/shared/

   # Upload backend build
   scp -r packages/backend/dist deploy@170.64.209.76:/var/www/community-hub/packages/backend/

   # Upload frontend build
   scp -r packages/frontend/dist/* deploy@170.64.209.76:/var/www/community-hub/packages/frontend/dist/

   # Upload Prisma files (schema + migrations)
   scp -r packages/backend/prisma deploy@170.64.209.76:/var/www/community-hub/packages/backend/

   # Upload package files for dependency install
   scp packages/backend/package.json deploy@170.64.209.76:/var/www/community-hub/packages/backend/
   scp packages/shared/package.json deploy@170.64.209.76:/var/www/community-hub/packages/shared/
   scp packages/frontend/package.json deploy@170.64.209.76:/var/www/community-hub/packages/frontend/
   scp package.json pnpm-lock.yaml pnpm-workspace.yaml deploy@170.64.209.76:/var/www/community-hub/

   echo "Files uploaded"
   ```

8. **Update Server via SSH**:
   ```bash
   echo "Updating server..."

   ssh deploy@170.64.209.76 "cd /var/www/community-hub && \
     pnpm install --frozen-lockfile && \
     cd packages/backend && \
     npx prisma generate && \
     export \$(grep -v '^#' .env | grep -v '^\$' | xargs) && \
     npx prisma migrate deploy && \
     mkdir -p dist/generated && cp -r src/generated/prisma dist/generated/ && \
     sudo systemctl reload nginx && \
     pm2 restart community-hub-api && \
     sleep 5 && \
     curl -f http://localhost:5000/api/v1/health && \
     echo '' && \
     pm2 list | grep community-hub-api"

   echo ""
   echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
   echo "DEPLOYMENT COMPLETE"
   echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
   echo ""
   echo "URL: http://170.64.209.76"
   echo "Health Check: Passed"
   echo "PM2 Status: Running"
   echo "Backup: $BACKUP_DIR/$BACKUP_FILE"
   echo ""
   echo "Verify deployment in browser"
   echo ""
   ```
   - Uses `pnpm install --frozen-lockfile` for reproducible installs
   - Exports env vars from .env for Prisma migrate
   - Copies Prisma generated client to dist/ (needed because tsx runs from src/ but some paths reference dist/)
   - Sleep 5 seconds for PM2 to stabilize before health check

### GitHub Actions Mode (--git flag)

When using the `--git` flag, follow the PR workflow:

1. **Run Local Tests (MANDATORY)**:
   ```bash
   pnpm test
   ```
   - STOP if tests fail

2. **Pre-Deployment Checks**:
   ```bash
   CURRENT_BRANCH=$(git branch --show-current)
   echo "Current branch: $CURRENT_BRANCH"

   if [ -n "$(git status --porcelain)" ]; then
     echo "Uncommitted changes detected"
     git status --short
   else
     echo "Working directory is clean"
   fi

   git fetch origin
   ```

3. **Review Changes**:
   ```bash
   echo "Commits not yet deployed:"
   git log origin/main..HEAD --oneline
   ```

4. **User Confirmation**:
   Ask user to confirm before creating PR to main.

5. **Create Pull Request**:
   ```bash
   gh pr create \
     --base main \
     --head $(git branch --show-current) \
     --title "Production Deployment" \
     --body "$(cat <<'EOF'
   ## Production Deployment

   ### Changes
   [Summarize key changes]

   ### Impact
   - **Scope:** [Frontend/Backend/Both]
   - **Database:** [Migrations: Yes/No]

   ### Deployment Notes
   - Server: 170.64.209.76
   - Zero-downtime via PM2 restart

   Co-Authored-By: Dunskii <andrew@dunskii.com>
   EOF
   )"
   ```

6. **Post-PR Instructions**:
   Tell user to merge PR in GitHub, then monitor deployment.

---

## Database Migration Safety

### SAFE migrations only:
- Add new tables
- Add new columns (with default values or nullable)
- Add indexes
- Add new constraints (after verifying data compliance)

### NEVER create migrations that:
- Drop tables
- Drop columns
- Modify existing data without explicit migration script
- Change column types that could cause data loss

### Review Checklist
```bash
cd packages/backend/prisma/migrations/
ls -lt  # List by date
cat <latest-migration>/migration.sql  # Review SQL
```

- `DROP TABLE` / `DROP COLUMN` - NEVER in production
- `ALTER COLUMN ... TYPE` - Could cause data loss
- `CREATE TABLE` / `ADD COLUMN` - Safe
- `CREATE INDEX` - Safe

---

## Emergency Rollback

### Database Restore:
```bash
# Find latest backup
ls -lht backups/production/community-hub-*.sql | head -1

# Upload and restore
scp backups/production/community-hub-YYYY-MM-DD-HHMMSS.sql deploy@170.64.209.76:/home/deploy/backups/
ssh deploy@170.64.209.76 "psql -h localhost -U community_hub community_hub < /home/deploy/backups/community-hub-YYYY-MM-DD-HHMMSS.sql && pm2 restart community-hub-api"
```

### Code Rollback:
```bash
# Redeploy from previous commit
git log --oneline -5
git checkout <previous-commit>
/deploy
git checkout main
```

---

## Important Notes

### SCP Mode (Default)
- Automatic database backup before every deployment
- Migration review with safety checks
- Local builds avoid server resource constraints
- Zero-downtime PM2 restart
- Health check verification
- Backup retention: last 10 (local and remote)
- pnpm monorepo: shared must build before backend

### Server-Specific Notes
- **tsx runtime**: Backend runs via tsx from src/index.ts (not compiled dist/index.js) due to moduleResolution: "bundler" in tsconfig
- **Prisma client**: Generated to src/generated/prisma, must be copied to dist/generated/ after prisma generate
- **No Elasticsearch**: Pilot runs without ES, graceful degradation active
- **No Mapbox**: Token not configured, map features limited
- **No domain/SSL**: Currently IP-only access (http://170.64.209.76)

---

## Workflow Summary

### SCP Workflow (Default)
```
Backup DB -> [Optional: Run Tests] -> Build Locally (shared -> backend -> frontend) ->
Check Migrations -> Review Safety -> Confirm -> Clean Stale Assets ->
Upload via SCP -> Install Deps -> Run Migrations -> Restart PM2 -> Health Check
```

### GitHub Actions Workflow (--git flag)
```
Run Tests -> Create PR -> Review PR -> Merge PR ->
GitHub Actions Deploys -> Verify
```
