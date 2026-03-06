#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/prompt-manager}"
ENV_DIR="${ENV_DIR:-/etc/prompt-manager}"
ENV_FILE="${ENV_FILE:-$ENV_DIR/prompt-manager.env}"
DATA_DIR="${DATA_DIR:-/var/lib/prompt-manager}"
SERVICE_NAME="${SERVICE_NAME:-prompt-manager}"
SERVICE_SRC_REL="${SERVICE_SRC_REL:-deploy/prompt-manager.service}"
DEFAULT_PORT="${PORT:-3000}"
DEFAULT_HOST="${HOST:-0.0.0.0}"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Please run as root: sudo bash deploy/one-click.sh"
  exit 1
fi

if [[ ! -f "package.json" ]]; then
  echo "Please run this script from project root."
  exit 1
fi

if ! id -u www-data >/dev/null 2>&1; then
  echo "System user 'www-data' does not exist."
  exit 1
fi

if ! command -v apt-get >/dev/null 2>&1; then
  echo "This script currently supports Debian/Ubuntu (apt-get)."
  exit 1
fi

ensure_cmd() {
  local cmd="$1"
  shift
  if ! command -v "${cmd}" >/dev/null 2>&1; then
    "$@"
  fi
}

ensure_node20() {
  if command -v node >/dev/null 2>&1; then
    local major
    major="$(node -v | sed -E 's/^v([0-9]+).*/\1/')"
    if [[ "${major}" -ge 20 ]]; then
      return 0
    fi
  fi

  apt-get update
  apt-get install -y ca-certificates curl gnupg
  install -m 0755 -d /etc/apt/keyrings
  if [[ ! -f /etc/apt/keyrings/nodesource.gpg ]]; then
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
      | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
  fi
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" \
    > /etc/apt/sources.list.d/nodesource.list
  apt-get update
  apt-get install -y nodejs
}

ensure_node20
ensure_cmd git apt-get install -y git
ensure_cmd rsync apt-get install -y rsync
ensure_cmd openssl apt-get install -y openssl

mkdir -p "${ENV_DIR}" "${DATA_DIR}"
chown -R www-data:www-data "${DATA_DIR}"

if [[ -z "${API_KEY:-}" ]]; then
  API_KEY="$(openssl rand -hex 24)"
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  cat > "${ENV_FILE}" <<EOF
DATABASE_URL="file:${DATA_DIR}/prod.db"
PORT=${DEFAULT_PORT}
HOST=${DEFAULT_HOST}
API_KEY=${API_KEY}
EOF
  chmod 640 "${ENV_FILE}"
fi

mkdir -p "${APP_DIR}"
rsync -a --delete \
  --exclude ".git" \
  --exclude "node_modules" \
  --exclude "web/node_modules" \
  ./ "${APP_DIR}/"
chown -R www-data:www-data "${APP_DIR}"

cd "${APP_DIR}"
npm ci
npm ci --prefix web
npm run prisma:generate
npm run db:deploy
npm run build

if [[ ! -f "${SERVICE_SRC_REL}" ]]; then
  echo "Missing service file: ${SERVICE_SRC_REL}"
  exit 1
fi

cp "${SERVICE_SRC_REL}" "/etc/systemd/system/${SERVICE_NAME}.service"
systemctl daemon-reload
systemctl enable "${SERVICE_NAME}"
systemctl restart "${SERVICE_NAME}"

echo
echo "Deployment completed."
echo "Service: systemctl status ${SERVICE_NAME}"
echo "Env file: ${ENV_FILE}"
echo "API port: ${DEFAULT_PORT}"
