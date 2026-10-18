#!/bin/sh
set -eu

: "${SSH_HOST:?Missing SSH_HOST}"
: "${SSH_PORT:?Missing SSH_PORT}"
: "${SSH_USER:?Missing SSH_USER}"
case "$SSH_PORT" in ''|*[!0-9]*) echo 'SSH_PORT must be numeric' >&2; exit 1;; esac
case "$SSH_HOST" in ''|*[!a-zA-Z0-9.-]*) echo 'Invalid SSH_HOST' >&2; exit 1;; esac
case "$SSH_USER" in ''|*[!a-zA-Z0-9_-]*) echo 'Invalid SSH_USER' >&2; exit 1;; esac

key="${SSH_KEY_PATH:-$HOME/.ssh/github_actions_hostinger}"
remote="$SSH_USER@$SSH_HOST"
target='domains/ventoteam.com/public_html'
release="$(date -u +%Y%m%dT%H%M%SZ)-${GITHUB_SHA:-manual}"
case "$release" in *[!a-zA-Z0-9_-]*) echo 'Invalid release identifier' >&2; exit 1;; esac

# Private backups outside public_html; only the entrypoint and server policy change
# in place. Hashed assets from older releases remain available for cached pages.
ssh -i "$key" -p "$SSH_PORT" "$remote" "umask 077; mkdir -p domains/ventoteam.com/deploy-backups/$release; chmod 700 domains/ventoteam.com/deploy-backups domains/ventoteam.com/deploy-backups/$release; for file in index.html .htaccess; do if test -f $target/\$file; then cp $target/\$file domains/ventoteam.com/deploy-backups/$release/\$file; fi; done"

# rsync's remote shell is parsed by a shell: quote the only variable argument.
escaped_key=$(printf '%s' "$key" | sed "s/'/'\\\\''/g")
rsh="ssh -i '$escaped_key' -p $SSH_PORT"
rsync --archive --compress --human-readable --rsh="$rsh" \
  --exclude=/index.html --exclude=/.htaccess dist/ "$remote:$target/"

# Upload temporary files, then atomically rename each file on the same filesystem.
rsync --archive --compress --rsh="$rsh" dist/.htaccess "$remote:$target/.htaccess.next"
rsync --archive --compress --rsh="$rsh" dist/index.html "$remote:$target/index.html.next"
ssh -i "$key" -p "$SSH_PORT" "$remote" "mv $target/.htaccess.next $target/.htaccess; mv $target/index.html.next $target/index.html"
printf 'Backup: domains/ventoteam.com/deploy-backups/%s\n' "$release"
