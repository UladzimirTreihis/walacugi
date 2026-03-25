#!/usr/bin/env bash
set -euo pipefail

# This script:
# 1) Prompts for a new admin password (hidden input)
# 2) Generates a bcrypt hash using backend's bcryptjs (default 10 rounds)
# 3) Escapes $ characters for docker-compose interpolation (-> $$)
# 4) Replaces/sets ADMIN_PASSWORD_HASH in backend/.env
#
# Usage:
#   bash scripts/update-admin-password.sh
# Optional:
#   BCRYPT_ROUNDS=12 bash scripts/update-admin-password.sh
#
# Requirements:
# - Node.js installed
# - backend/node_modules present (run `npm install` in backend/ first)

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="${REPO_ROOT}/backend"
ENV_FILE="${BACKEND_DIR}/.env"
ROUNDS="${BCRYPT_ROUNDS:-10}"

if ! command -v node >/dev/null 2>&1; then
  echo "Error: Node.js is required on your host to run this script."
  exit 1
fi

if [[ ! -d "${BACKEND_DIR}/node_modules" ]]; then
  echo "Error: backend/node_modules not found."
  echo "Run: (cd backend && npm install) then re-run this script."
  exit 1
fi

read -r -s -p "Enter new admin password: " ADMIN_PWD
echo
if [[ -z "${ADMIN_PWD}" ]]; then
  echo "Error: Password cannot be empty."
  exit 1
fi

# Use backend's installed bcryptjs via a Node one-liner
HASH="$(
  cd "${BACKEND_DIR}"
  PWD_VAL="${ADMIN_PWD}" ROUNDS="${ROUNDS}" node -e 'const bcrypt=require("bcryptjs"); bcrypt.hash(process.env.PWD_VAL, Number(process.env.ROUNDS)||10).then(h=>console.log(h));'
)"

if [[ -z "${HASH}" ]]; then
  echo "Error: Failed to generate bcrypt hash."
  exit 1
fi

# Escape $ for docker-compose interpolation
ESCAPED_HASH="${HASH//\$/\$\$}"

mkdir -p "${BACKEND_DIR}"
touch "${ENV_FILE}"
cp "${ENV_FILE}" "${ENV_FILE}.bak.$(date +%s)" >/dev/null 2>&1 || true

if grep -qE '^ADMIN_PASSWORD_HASH=' "${ENV_FILE}"; then
  # Replace existing line
  # Use | as sed delimiter to avoid conflicts
  sed -i "s|^ADMIN_PASSWORD_HASH=.*$|ADMIN_PASSWORD_HASH=${ESCAPED_HASH}|" "${ENV_FILE}"
else
  # Append
  printf "\nADMIN_PASSWORD_HASH=%s\n" "${ESCAPED_HASH}" >> "${ENV_FILE}"
fi

echo "Updated ${ENV_FILE} with escaped ADMIN_PASSWORD_HASH."
echo "Reminder: Recreate backend container to load new env:"
echo "  cd backend && docker compose down && docker compose up -d --build"

