#!/usr/bin/env bash
set -euo pipefail

SERVICE_NAME="tss-stomp.service"
SERVICE_TARGET="/etc/systemd/system/${SERVICE_NAME}"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this script as root (for example: sudo ./scripts/uninstall-service.sh)"
  exit 1
fi

if systemctl list-unit-files | grep -q "^${SERVICE_NAME}"; then
  systemctl disable --now "${SERVICE_NAME}" || true
fi

if [[ -f "${SERVICE_TARGET}" ]]; then
  rm -f "${SERVICE_TARGET}"
fi

systemctl daemon-reload
systemctl reset-failed || true

echo "Service removed: ${SERVICE_NAME}"
echo "Note: /etc/default/tss-stomp was left in place. Remove it manually if not needed."
