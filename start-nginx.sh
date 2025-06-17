#!/bin/sh

# Set default port if not provided
export PORT=${PORT:-8080}

# Generate nginx.conf from template
envsubst '${PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# Start nginx
exec nginx -g "daemon off;" 