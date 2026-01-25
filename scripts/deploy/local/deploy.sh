#!/usr/bin/env bash
set -euo pipefail
echo "Deploying games locally..."
cd "$(dirname "$0")/../../.."
uv sync
echo "Done."
