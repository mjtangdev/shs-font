#!/bin/bash
# Increase Node memory limit for the build process
export NODE_OPTIONS=--max-old-space-size=8192

### Build for Linux amd64 (Intel/AMD)
#docker buildx build \
#--platform linux/amd64 \
#--build-arg NEXT_PUBLIC_API_URL=https://api.shstest.site/api/v1 \
#-t mjtangdev/shs-frontend:latest \
#--push \
#.

#
#docker buildx build \
#  --platform linux/amd64 \
#  --build-arg NEXT_PUBLIC_API_URL=http://172.16.11.114:8000/api/v1 \
#  -t mjtangdev/shs-frontend:latest \
#  --push .

## Build for Linux amd64 (Intel/AMD)
#docker buildx build \
#--platform linux/amd64 \
#--build-arg NEXT_PUBLIC_API_URL=http://172.27.160.1:8000/api/v1 \
#-t mjtangdev/shs-frontend:latest \
#--push \
#.

# Build for Linux amd64 (Intel/AMD)
docker buildx build \
--platform linux/amd64 \
--build-arg NEXT_PUBLIC_API_URL=http://192.168.0.117:8000/api/v1 \
-t mjtangdev/shs-frontend:latest \
--push \
.