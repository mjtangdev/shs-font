@echo off
REM Increase Node memory limit for the build process
set NODE_OPTIONS=--max-old-space-size=8192

REM Build for Linux amd64 (Intel/AMD)
docker buildx build ^
--platform linux/amd64 ^
--build-arg NEXT_PUBLIC_API_URL=http://192.168.3.60:8085/api/v1 ^
-t mjtangdev/shs-frontend:quezelco ^
--push ^
.
