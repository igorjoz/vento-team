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
backup="domains/ventoteam.com/deploy-backups/$release"
test -s dist/index.html
test -f dist/.htaccess

# Private backups outside public_html; only the entrypoint and server policy change
# in place. Hashed assets from older releases remain available for cached pages.
ssh -i "$key" -p "$SSH_PORT" "$remote" sh -s -- "$target" "$backup" <<'REMOTE_BACKUP'
set -eu
target=$1
backup=$2
umask 077
mkdir -p domains/ventoteam.com/deploy-backups
chmod 700 domains/ventoteam.com/deploy-backups
# Refuse to overwrite an existing backup, including retries in the same second.
mkdir "$backup"
for file in index.html .htaccess; do
  if test -e "$target/$file" || test -L "$target/$file"; then
    test -f "$target/$file"
    cp -p "$target/$file" "$backup/$file"
  else
    : > "$backup/$file.absent"
  fi
done
REMOTE_BACKUP

# rsync's remote shell is parsed by a shell: quote the only variable argument.
escaped_key=$(printf '%s' "$key" | sed "s/'/'\\\\''/g")
rsh="ssh -i '$escaped_key' -p $SSH_PORT"
rsync --archive --compress --human-readable --rsh="$rsh" \
  --exclude=/index.html --exclude=/.htaccess dist/ "$remote:$target/"

# Upload temporary files, then atomically rename each file on the same filesystem.
rsync --archive --compress --rsh="$rsh" dist/.htaccess "$remote:$target/.htaccess.next"
rsync --archive --compress --rsh="$rsh" dist/index.html "$remote:$target/index.html.next"
ssh -i "$key" -p "$SSH_PORT" "$remote" sh -s -- "$target" "$backup" <<'REMOTE_ACTIVATE'
set -eu
target=$1
backup=$2
activating=0

restore_file() {
  file=$1
  if test -f "$backup/$file.absent"; then
    rm -f "$target/$file"
  elif test -f "$backup/$file"; then
    cp -p "$backup/$file" "$target/$file.rollback" &&
      mv "$target/$file.rollback" "$target/$file"
  else
    echo "Missing rollback data for $file in $backup" >&2
    return 1
  fi
}

rollback_on_error() {
  status=$?
  trap - 0 1 2 15
  if test "$status" -ne 0 && test "$activating" -eq 1; then
    echo "Activation failed; restoring HTML and configuration from $backup" >&2
    failed=0
    for file in index.html .htaccess; do
      if ! restore_file "$file"; then
        echo "ROLLBACK FAILED for $file; restore manually from $backup" >&2
        failed=1
      fi
    done
    if test "$failed" -eq 0; then
      echo 'Previous HTML and configuration restored.' >&2
    fi
  fi
  exit "$status"
}

trap rollback_on_error 0
trap 'exit 129' 1
trap 'exit 130' 2
trap 'exit 143' 15
test -f "$target/.htaccess.next"
test -s "$target/index.html.next"
activating=1
mv "$target/.htaccess.next" "$target/.htaccess"
mv "$target/index.html.next" "$target/index.html"
trap - 0 1 2 15
REMOTE_ACTIVATE
printf 'Backup: %s\n' "$backup"
