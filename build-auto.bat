@echo off
set NODE_OPTIONS=--max-old-space-size=8192

echo ==================================================
echo  正在构建 [IP 自动适应/局域网通用] Docker 镜像
echo  目标镜像 : mjtangdev/shs-frontend:auto
echo  适应模式 : 运行时自动匹配浏览器访问 IP (:8008/api/v1)
echo ==================================================

docker buildx build --platform linux/amd64 --build-arg NEXT_PUBLIC_API_URL="" -t mjtangdev/shs-frontend:auto --push .

if %ERRORLEVEL% EQU 0 (
    echo ✅ 构建并推送成功: mjtangdev/shs-frontend:auto
) else (
    echo ❌ 构建失败
)
