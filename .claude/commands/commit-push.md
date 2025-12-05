Analyze all staged and unstaged changes in the repository.

## Pre-commit checks (STOP if any found):

1. **Secrets & Keys** - scan for:
    - API keys, tokens, secrets (AWS, OpenAI, Stripe, etc.)
    - Passwords, credentials, connection strings
    - Private keys (*.pem, *.key content)
    - .env values accidentally hardcoded.

2. **Debug artifacts** - warn about:
    - `console.log`, `debugger`, `print()` statements
    - Commented-out code blocks
    - TODO/FIXME that should be resolved

3. **Git issues** - check for:
    - Merge conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`)
    - Files that should be in .gitignore (node_modules, .env, dist, etc.)
    - Unusually large files (>1MB)

4. **Code quality**:
    - Run linter if configured (`npm run lint`)
    - Check for TypeScript errors if applicable. Fix

## If checks pass:

1. Group related changes into logical commits
2. For each group:
    - Stage only those files (`git add`)
    - Commit with conventional commit message (feat/fix/refactor/docs/chore)
    - Describe WHAT was done, not HOW
    - Never mention AI, Claude, or code generation
3. Push to remote

## Commit message format:
- `type(scope): description` — under 72 chars
- Body if needed: explain WHY, not WHAT

Start with `git status` and `git diff` to analyze changes.