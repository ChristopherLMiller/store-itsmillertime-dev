#!/usr/bin/env bash
set -euo pipefail

BUILD_FOLDER=".medusa/server"
ROOT_FOLDER="$(pwd)"

if [[ "${MEDUSA_RUN_MIGRATION:-true}" == "true" ]]; then
  # Without a flag, link syncing prompts interactively whenever a link table
  # changes, which hangs forever in a container with no TTY. By default only
  # apply safe link actions (creating tables). Set MEDUSA_EXECUTE_ALL_LINKS=true
  # for a deploy that must also update or delete link tables, then unset it.
  if [[ "${MEDUSA_EXECUTE_ALL_LINKS:-false}" == "true" ]]; then
    LINK_SYNC_FLAG="--execute-all-links"
  else
    LINK_SYNC_FLAG="--execute-safe-links"
  fi
  npx medusa db:migrate "$LINK_SYNC_FLAG"
fi

if [[ "${MEDUSA_CREATE_ADMIN_USER:-false}" == "true" ]]; then
  if [[ -z "${MEDUSA_ADMIN_EMAIL:-}" || -z "${MEDUSA_ADMIN_PASSWORD:-}" ]]; then
    echo "MEDUSA_ADMIN_EMAIL and MEDUSA_ADMIN_PASSWORD are required when MEDUSA_CREATE_ADMIN_USER=true" >&2
    exit 1
  fi

  set +e
  CREATE_OUTPUT="$(npx medusa user -e "$MEDUSA_ADMIN_EMAIL" -p "$MEDUSA_ADMIN_PASSWORD" 2>&1)"
  CREATE_EXIT_CODE=$?
  set -e

  echo "$CREATE_OUTPUT"
  if [[ $CREATE_EXIT_CODE -ne 0 && "$CREATE_OUTPUT" != *"already exists"* ]]; then
    exit "$CREATE_EXIT_CODE"
  fi
fi

if [[ ! -e "$BUILD_FOLDER/node_modules" ]]; then
  ln -s "$ROOT_FOLDER/node_modules" "$BUILD_FOLDER/node_modules"
fi

cd "$BUILD_FOLDER"
exec npx medusa start
