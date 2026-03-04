#!/usr/bin/env bash
set -euo pipefail

SERVICE_NAME="tss-stomp.service"
SINCE="${1:-10 minutes ago}"

echo "== systemctl status: ${SERVICE_NAME} =="
sudo systemctl --no-pager --full status "${SERVICE_NAME}" || true
echo
echo "== journalctl logs: ${SERVICE_NAME} (since: ${SINCE}) =="
sudo journalctl --no-pager -u "${SERVICE_NAME}" --since "${SINCE}" || true
