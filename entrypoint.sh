#!/usr/bin/env bash
set -euo pipefail

# Basic env defaults (user can override with docker run -e ...)
JUNEO_HOME=/home/juneogo
# The Juneo binary is now located in the user's home directory, as per the manual setup guide.
JUNEO_BIN=${JUNEO_HOME}/juneogo 
WEB_DIR=/opt/juneo-web
PORT=${PORT:-8080}

export HOME="${JUNEO_HOME}"

# Ensure directories exist and ownership is correct (redundant but safe)
mkdir -p "${JUNEO_HOME}/.juneogo/staking"
chown -R juneogo:juneogo "${JUNEO_HOME}"

# Give execution rights to juneogo binary if present
# The Dockerfile now ensures +x permissions on the final destination.
if [ -f "${JUNEO_BIN}" ]; then
  true 
fi

# Start the Node/Express app (which will spawn the juneogo binary and manage it)
cd "${WEB_DIR}"

# Pass environment variables to the Node app (server.js)
export JUNEO_BIN_PATH="${JUNEO_BIN}"
export JUNEO_HOME="${JUNEO_HOME}"
export APP_PORT="${PORT}"

# run as root to allow opening ports; server will drop privileges when spawning juneogo
node server.js
