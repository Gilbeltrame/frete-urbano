#!/bin/sh
set -e

# Render nginx.conf from template using BACKEND_HOST env var (default to 'backend')
: ${BACKEND_HOST:=backend}
echo "Rendering /etc/nginx/conf.d/default.conf with BACKEND_HOST=${BACKEND_HOST}"
envsubst '$BACKEND_HOST' < /etc/nginx/conf.d/nginx.conf.template > /etc/nginx/conf.d/default.conf

# Execute original command
exec "$@"
