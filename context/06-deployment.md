# Mahdara - Deployment

## Infrastructure

- **Domain**: `mahdara.next-version.com` (single domain, frontend + API)
- **Server SSH alias**: `prcm.prod`
- **App folder on server**: `/var/www/mahdara-payment`
- **Rails port**: `3062` (configured in `backend/.env` and `puma.rb`)
- **Nginx**: serves React SPA from `/var/www/mahdara-payment/client/dist`, proxies `/api/` to port 3062
- **Systemd service**: `mahdara` (`mahdara.service`)
- **Config files**: `mahdara.conf` (nginx), `mahdara.service` (systemd)

## Git Remote

The git remote is named `mahdara`, not `origin`:

```bash
git push mahdara main   # correct
git push origin main    # wrong — points to bestcar repo
```

## Deploy Command

Run from local machine:

```bash
# 1. Push code
git push mahdara main

# 2. Trigger deploy on server
ssh prcm.prod 'ssh-agent bash -c "cd /var/www/mahdara-payment && bash deploy.sh"'
```

## What deploy.sh Does (runs on server)

1. Loads SSH keys (`~/.ssh/id_rsa_all`) for GitHub access
2. `git pull origin main`
3. `bundle install` (backend dependencies)
4. `npm install` (frontend dependencies)
5. `npm run build` (Vite production build → `client/dist/`)
6. `rails db:migrate RAILS_ENV=production`
7. `systemctl restart mahdara`

## Running Rails Commands on Production

Non-interactive SSH sessions have no `$PATH` and no env vars. Two things are required:

1. **Inject rbenv into PATH** manually
2. **Source `backend/.env`** to get `SECRET_KEY_BASE` (required by Rails — missing it causes `ArgumentError: Missing secret_key_base`)

**Canonical pattern for `rails runner`:**

```bash
ssh prcm.prod 'export PATH="$HOME/.rbenv/bin:$HOME/.rbenv/shims:$PATH" && cd /var/www/mahdara-payment/backend && set -a && source .env && set +a && RAILS_ENV=production rails runner "YOUR CODE HERE"'
```

- `set -a` / `set +a` exports all vars from `.env` automatically
- Never use `rails` without the rbenv PATH prefix — it will fail with `command not found`
- Never use `rails runner` without sourcing `.env` — it will fail with `Missing secret_key_base`
- Prefer `rails runner` over `psql` for DB queries

## Gotchas

- **deploy.sh edits**: if you modify deploy.sh, run the deploy command **twice** — the first run pulls the new script but executes the old one; the second run uses the updated version.
- **PATH setup**: deploy.sh is self-sufficient — it injects rbenv and nvm paths at the top so it works in non-interactive SSH sessions (no need to source `.bashrc`).
- **ssh-agent wrapper**: the deploy command must be wrapped in `ssh-agent bash -c "..."` so the SSH key can be added inside the non-interactive session.

## Logs

- **Puma (Rails) logs**: `/var/www/mahdara-payment/backend/log/puma.stdout.log`

## Useful Server Commands

```bash
# View live Rails logs
ssh prcm.prod 'tail -f /var/www/mahdara-payment/backend/log/puma.stdout.log'

# Check service status
ssh prcm.prod 'systemctl status mahdara'

# View systemd logs
ssh prcm.prod 'journalctl -u mahdara -f'

# Check nginx
ssh prcm.prod 'systemctl status nginx'
```
