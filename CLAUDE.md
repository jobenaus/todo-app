# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Todo app built with Rails 8.1 and SQLite, designed to run on [ONCE](https://github.com/basecamp/once) as a self-hosted Docker container. The public image is at `ghcr.io/jobenaus/todo-app:latest`.

## Commands

### Development

```bash
bin/rails server                    # Start dev server (port 3000)
bin/rails db:prepare                # Create/migrate database
bin/rails console                   # Rails console
```

### Docker Build & Deploy

```bash
docker build -t todo-app .                          # Build image
docker tag todo-app:latest ghcr.io/jobenaus/todo-app:latest
docker push ghcr.io/jobenaus/todo-app:latest        # Push to ghcr

# First deploy
once deploy ghcr.io/jobenaus/todo-app:latest --host <hostname> --disable-tls --env DISABLE_SSL=true

# Update existing deployment (pulls latest from ghcr)
once update <hostname>
```

### Testing (Playwright)

```bash
npm run test:e2e                        # Run all tests (preferred)
npx playwright test --reporter=list     # Verbose output
npx playwright test -g "can create"     # Run tests matching pattern
```

Tests run against `http://todo.localhost` (configured in `playwright.config.ts`). The app must be deployed via ONCE before running tests. Tests are serial and stateful — earlier tests create data used by later tests. The `deleteAllTodos` helper cleans up leftover state at the start.

## Architecture

Single-model Rails app: `Todo` (title:string, completed:boolean). The `TodosController` handles standard CRUD plus a `toggle` action (`PATCH /todos/:id/toggle`). Root route is `todos#index`. Redirects after mutations should use `root_path` (`/`) not `todos_path` (`/todos`) so Playwright `waitForURL("/")` calls work correctly.

### ONCE Compatibility

The app satisfies ONCE's container contract:
- **Port 80**: Puma serves on port 80 (set in Dockerfile CMD)
- **Healthcheck**: `/up` via Rails built-in `rails/health#show`
- **Persistent storage**: SQLite DB at `/storage/production.sqlite3` (production database.yml). ONCE mounts a volume to both `/storage` and `/rails/storage`.
- **SSL**: Disabled via `DISABLE_SSL` env var (ONCE handles TLS termination). The production config checks this env var for `assume_ssl` and `force_ssl`.
- **Host authorization**: `config.hosts` is cleared in production to allow ONCE proxy requests.
- **Migrations**: `bin/docker-entrypoint` runs `db:prepare` on server start.
- **Secret key**: ONCE provides `SECRET_KEY_BASE` automatically.

## Workflow Preferences

- **Full pipeline in one go**: Build feature, Dockerize, push to ghcr, `once update`, test with Playwright — all in a single session. Don't stop at "it works locally."
- **Always use ghcr.io**: Never use a local registry. Always push to `ghcr.io/jobenaus/todo-app:latest` and let ONCE pull from there.
- **Redeploy with `once update`**: Use `once update <hostname>` to pull the latest image and restart — not remove + deploy.
- **Playwright for E2E testing**: Tests run against the live ONCE deployment, not a dev server. Use `data-testid` attributes for selectors.
- **ghcr.io auth**: Re-login with `gh auth token | docker login ghcr.io -u jobenaus --password-stdin` if push fails with scope errors.
- **Git remote**: Push to `jobenaus/todo-app` on GitHub (HTTPS).
- **Always commit and push** after making changes.

## Gotchas

- **No Turbo**: This app does not include turbo-rails. `data-turbo-confirm` attributes on buttons are inert — they do not produce browser confirm dialogs. Don't rely on Turbo behaviors.
- **ES modules and DOMContentLoaded**: JavaScript is loaded via importmap as `type="module"`. Do NOT wrap code in `DOMContentLoaded` — modules are already deferred, and the event may fire before the module executes, causing listeners to never register. Just put code at the top level of the module.
- **Inline edit preserves text**: The dblclick inline-edit handler in `application.js` keeps the original title text in a hidden `<span>` so that Playwright's `hasText` filters continue to match the parent `todo-item` while the edit input is visible.
