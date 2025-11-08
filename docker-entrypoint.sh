#!/bin/sh
set -e

# Render nginx.conf from template using BACKEND_HOST env var (default to 'backend')
: ${BACKEND_HOST:=backend}
# Make sure envsubst (an external program) sees the variable
export BACKEND_HOST
echo "Rendering /etc/nginx/conf.d/default.conf with BACKEND_HOST=${BACKEND_HOST}"
envsubst '$BACKEND_HOST' < /etc/nginx/conf.d/nginx.conf.template > /etc/nginx/conf.d/default.conf

# Sanity check: ensure the rendered config has a non-empty upstream host
if grep -qE "proxy_pass http://:+" /etc/nginx/conf.d/default.conf; then
	echo "ERROR: nginx config rendered with empty BACKEND_HOST. Check FRONTEND env vars." >&2
	echo "--- BEGIN GENERATED CONFIG ---" >&2
	sed -n '1,200p' /etc/nginx/conf.d/default.conf >&2
	echo "---  END  GENERATED CONFIG ---" >&2
	exit 1
fi

# Execute original command
exec "$@"
