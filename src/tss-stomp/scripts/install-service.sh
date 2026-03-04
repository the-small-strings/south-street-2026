#!/usr/bin/env bash
set -euo pipefail

SERVICE_NAME="tss-stomp.service"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
SERVICE_SOURCE="${PROJECT_DIR}/systemd/${SERVICE_NAME}"
SERVICE_TARGET="/etc/systemd/system/${SERVICE_NAME}"
ENV_FILE="/etc/default/tss-stomp"
ENV_SAMPLE_SOURCE="${PROJECT_DIR}/systemd/tss-stomp.env.sample"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this script as root (for example: sudo ./scripts/install-service.sh)"
  exit 1
fi

if [[ ! -f "${SERVICE_SOURCE}" ]]; then
  echo "Service definition not found: ${SERVICE_SOURCE}"
  exit 1
fi

WAS_RUNNING="false"
if systemctl is-active --quiet "${SERVICE_NAME}"; then
  WAS_RUNNING="true"
fi

install -m 0644 "${SERVICE_SOURCE}" "${SERVICE_TARGET}"

if [[ ! -f "${ENV_FILE}" ]]; then
  if [[ -f "${ENV_SAMPLE_SOURCE}" ]]; then
    install -m 0644 "${ENV_SAMPLE_SOURCE}" "${ENV_FILE}"
  else
    cat > "${ENV_FILE}" << 'EOF'
# Optional environment values for tss-stomp service.
# API_BASE_URL=http://192.168.1.101:33001
# USE_MOCK_GPIO=false
EOF
    chmod 0644 "${ENV_FILE}"
  fi
fi

systemctl daemon-reload
systemctl enable "${SERVICE_NAME}"

if [[ "${WAS_RUNNING}" == "true" ]]; then
  systemctl restart "${SERVICE_NAME}"
  echo "Service updated and restarted: ${SERVICE_NAME}"
else
  systemctl start "${SERVICE_NAME}"
  echo "Service installed and started: ${SERVICE_NAME}"
fi

systemctl --no-pager --full status "${SERVICE_NAME}" || true

