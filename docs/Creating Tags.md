### Creating Tags

```bash
# Annotated tag (recommended)
git tag -a v1.0.0 -m "Release version 1.0.0 - DaddyLive Integration"

# Push tags
git push origin v1.0.0

# Push all tags
git push origin --tags

# List tags
git tag -l

# Show tag details
git show v1.0.0

# Delete tag locally
git tag -d v1.0.0

# Delete tag remotely
git push origin --delete v1.0.0
```

---

## 🔍 Git Best Practices

### DO's ✅

1. **Commit Often**
   - Make small, logical commits
   - Each commit should represent one logical change
   - Easier to review and revert

2. **Write Descriptive Messages**
   - Clear subject line (50 chars max)
   - Detailed body if needed (72 chars per line)
   - Reference issues/tickets

3. **Keep Branches Short-Lived**
   - Feature branches: 1-3 days
   - Merge frequently to avoid conflicts
   - Delete after merging

4. **Review Your Changes**
   - Use `git diff` before committing
   - Review your own PR first
   - Test locally before pushing

5. **Sync Regularly**
   - Pull from develop daily
   - Rebase or merge to stay current
   - Resolve conflicts early

### DON'Ts ❌

1. **Don't Commit to Main**
   - Main is protected
   - Always use feature branches# 🌳 Git Workflow & Branching Strategy

## Overview
This document defines the Git workflow, branching strategy, commit conventions, and pull request process for the Arsenal Streams project.

---

## 🌿 Branching Strategy

### Branch Types

```
main (production)
  ↓
develop (integration)
  ↓
feature/* (new features)
bugfix/* (bug fixes)
hotfix/* (urgent production fixes)
release/* (release preparation)
```

### Branch Naming Conventions

**Feature Branches:**
```
feature/daddylive-integration
feature/quality-ranking-system
feature/user-authentication
feature/AS-123-stream-player
```

**Bugfix Branches:**
```
bugfix/stream-validation-error
bugfix/AS-456-memory-leak
bugfix/pagination-offset-calculation
```

**Hotfix Branches:**
```
hotfix/critical-security-patch
hotfix/AS-789-api-timeout
hotfix/stream-playback-failure
```

**Release Branches:**
```
release/v1.0.0
release/v1.1.0
```

---

## 📝 Commit Message Convention

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- **feat:** New feature
- **fix:** Bug fix
- **docs:** Documentation changes
- **style:** Code style changes (formatting, missing semicolons, etc.)
- **refactor:** Code refactoring
- **perf:** Performance improvements
- **test:** Adding or updating tests
- **chore:** Build process or auxiliary tool changes
- **ci:** CI/CD changes
- **revert:** Revert previous commit

### Scopes
- **api:** API endpoints
- **ui:** User interface
- **service:** Business logic services
- **adapter:** External adapters
- **database:** Database changes
- **security:** Security-related
- **config:** Configuration
- **deps:** Dependencies

### Examples

**Good Commits:**
```bash
feat(api): add DaddyLive match listing endpoint

Implement GET /v1/matches endpoint that fetches matches from DaddyLive API.
Includes filtering by league and status, pagination support, and caching.

Closes #123

---

fix(service): resolve stream validation timeout issue

Stream health checks were timing out after 5s. Increased timeout to 10s
and added retry logic with exponential backoff.

Fixes #456

---

perf(adapter): optimize repository parsing performance

Switched from DOM parsing to SAX parsing for large XML files.
Reduces memory usage by 60% and parsing time by 40%.

Related to #789

---

docs(api): update API documentation with new endpoints

---

chore(deps): upgrade Next.js to 14.2.0

---

refactor(utils): extract link quality scoring into separate module

---

test(service): add integration tests for DaddyLive service
```

**Bad Commits:**
```bash
❌ update code
❌ fix bug
❌ WIP
❌ asdf
❌ Fixed the thing that was broken
❌ Updated some files
```

---

## 🔄 Development Workflow

### 1. Starting New Work

```bash
# Update develop branch
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/stream-quality-ranking

# Work on feature...
git add .
git commit -m "feat(service): implement stream quality ranking algorithm"

# Push branch
git push -u origin feature/stream-quality-ranking
```

### 2. Keeping Branch Updated

```bash
# Regularly sync with develop
git checkout develop
git pull origin develop

git checkout feature/stream-quality-ranking
git rebase develop

# Or merge if you prefer
git merge develop
```

### 3. Creating Pull Request

**Before Creating PR:**
- [ ] All tests passing locally
- [ ] Code linted and formatted
- [ ] No console.log statements
- [ ] Documentation updated
- [ ] Self-review completed

**PR Title Format:**
```
[Type] Brief description (Jira-123)
```

**Examples:**
```
[Feature] DaddyLive integration for match listing (AS-123)
[Fix] Resolve stream validation timeout issue (AS-456)
[Refactor] Extract quality scoring logic (AS-789)
```

**PR Description Template:**
```markdown
## Description
Brief description of what this PR does.

## Changes
- Added DaddyLive service class
- Implemented match listing API
- Added stream quality validation
- Updated API documentation

## Type of Change
- [x] New feature
- [ ] Bug fix
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [x] Unit tests added/updated
- [x] Integration tests added/updated
- [x] Manual testing completed
- [ ] E2E tests added/updated

## Checklist
- [x] Code follows style guidelines
- [x] Self-review completed
- [x] Comments added for complex logic
- [x] Documentation updated
- [x] No new warnings generated
- [x] Tests pass locally
- [x] Dependent changes merged

## Screenshots (if applicable)
[Add screenshots here]

## Related Issues
Closes #123
Related to #456

## Deployment Notes
- Requires new environment variable: `DADDYLIVE_API_KEY`
- Database migration needed: `npm run migrate`
```

### 4. Code Review Process

**Reviewer Checklist:**
- [ ] Code is readable and maintainable
- [ ] No security vulnerabilities
- [ ] Error handling is appropriate
- [ ] Tests are comprehensive
- [ ] Performance considerations addressed
- [ ] Documentation is adequate
- [ ] No unnecessary complexity
- [ ] Follows project conventions

**Review Comments:**
- Be constructive and specific
- Suggest improvements, don't just criticize
- Use prefixes: **MUST**, **SHOULD**, **NIT**, **QUESTION**

**Example Comments:**
```
MUST: Add input validation for the league parameter

SHOULD: Consider extracting this into a separate function for reusability

NIT: Missing semicolon on line 42

QUESTION: Why did you choose this approach over using the existing utility?
```

### 5. Merging

**Merge Requirements:**
- [ ] At least 1 approval
- [ ] All CI checks passing
- [ ] No merge conflicts
- [ ] Branch up to date with base

**Merge Strategies:**

**Squash and Merge** (Preferred for features):
```bash
# Combines all commits into one
git checkout develop
git merge --squash feature/stream-quality-ranking
git commit -m "feat(service): implement stream quality ranking"
```

**Rebase and Merge** (For clean history):
```bash
git checkout feature/stream-quality-ranking
git rebase develop
git checkout develop
git merge --ff-only feature/stream-quality-ranking
```

**Merge Commit** (For release branches):
```bash
git checkout develop
git merge --no-ff release/v1.0.0
```

### 6. After Merge

```bash
# Delete feature branch locally
git branch -d feature/stream-quality-ranking

# Delete remote branch
git push origin --delete feature/stream-quality-ranking
```

---

## 🚀 Release Process

### 1. Create Release Branch

```bash
git checkout develop
git pull origin develop
git checkout -b release/v1.0.0
```

### 2. Prepare Release

```bash
# Update version in package.json
npm version minor  # or major, patch

# Update CHANGELOG.md
# Run final tests
npm test
npm run test:e2e

# Fix any last-minute issues
git commit -m "chore(release): prepare v1.0.0"
```

### 3. Merge to Main

```bash
git checkout main
git merge --no-ff release/v1.0.0
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin main --tags
```

### 4. Merge Back to Develop

```bash
git checkout develop
git merge --no-ff release/v1.0.0
git push origin develop
```

### 5. Delete Release Branch

```bash
git branch -d release/v1.0.0
git push origin --delete release/v1.0.0
```

---

## 🔥 Hotfix Process

### 1. Create Hotfix Branch from Main

```bash
git checkout main
git pull origin main
git checkout -b hotfix/critical-security-patch
```

### 2. Fix Issue

```bash
# Make fixes
git add .
git commit -m "fix(security): patch XSS vulnerability in search"

# Update version
npm version patch
```

### 3. Merge to Main

```bash
git checkout main
git merge --no-ff hotfix/critical-security-patch
git tag -a v1.0.1 -m "Hotfix: Security patch"
git push origin main --tags
```

### 4. Merge to Develop

```bash
git checkout develop
git merge --no-ff hotfix/critical-security-patch
git push origin develop
```

### 5. Deploy and Cleanup

```bash
# Deploy to production
# Delete hotfix branch
git branch -d hotfix/critical-security-patch
git push origin --delete hotfix/critical-security-patch
```

---

## 📋 Git Hooks

### Pre-commit Hook
```bash
#!/bin/sh
# .git/hooks/pre-commit

echo "Running pre-commit checks..."

# Run linter
npm run lint
if [ $? -ne 0 ]; then
  echo "❌ Linting failed. Please fix errors before committing."
  exit 1
fi

# Run formatter check
npm run format:check
if [ $? -ne 0 ]; then
  echo "❌ Code not formatted. Run 'npm run format' first."
  exit 1
fi

# Run type check
npm run type-check
if [ $? -ne 0 ]; then
  echo "❌ Type check failed. Please fix type errors."
  exit 1
fi

# Check for secrets
npm run security:check-secrets
if [ $? -ne 0 ]; then
  echo "❌ Potential secrets detected. Remove them before committing."
  exit 1
fi

echo "✅ Pre-commit checks passed!"
```

### Commit-msg Hook
```bash
#!/bin/sh
# .git/hooks/commit-msg

commit_msg=$(cat "$1")

# Check commit message format
if ! echo "$commit_msg" | grep -qE "^(feat|fix|docs|style|refactor|perf|test|chore|ci|revert)(\(.+\))?: .{10,}"; then
  echo "❌ Invalid commit message format."
  echo "Format: <type>(<scope>): <subject>"
  echo "Example: feat(api): add DaddyLive integration"
  exit 1
fi

echo "✅ Commit message valid!"
```

### Pre-push Hook
```bash
#!/bin/sh
# .git/hooks/pre-push

echo "Running pre-push checks..."

# Run tests
npm test
if [ $? -ne 0 ]; then
  echo "❌ Tests failed. Fix them before pushing."
  exit 1
fi

# Run security audit
npm audit --production
if [ $? -ne 0 ]; then
  echo "⚠️  Security vulnerabilities found. Consider fixing before pushing."
  # Don't exit, just warn
fi

echo "✅ Pre-push checks passed!"
```

---

## 🏷️ Tagging Strategy

### Semantic Versioning

```
MAJOR.MINOR.PATCH

1.0.0 → 1.0.1 (patch)
1.0.0 → 1.1.0 (minor)
1.0.0 → 2.0.0 (major)
```

### When to Increment

**MAJOR** (Breaking changes):
- API endpoint removed or significantly changed
- Required parameters added
- Response format changed
- Database schema breaking change

**MINOR** (New features):
- New API endpoints
- New optional parameters
- New features that are backward compatible

**PATCH** (Bug fixes):
- Bug fixes
- Performance improvements
- Security patches
- Documentation updates

### Creating Tags

```bash
# Annotate
