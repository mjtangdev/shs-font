#!/bin/bash
# Increase Node memory limit for the build process
export NODE_OPTIONS=--max-old-space-size=8192

# Build for Linux amd64 (Intel/AMD)
docker buildx build \
--platform linux/amd64 \
--build-arg NEXT_PUBLIC_API_URL=http://q1.fortiddns.com:8085/api/v1 \
-t mjtangdev/shs-frontend:quezelco \
--push \
.
