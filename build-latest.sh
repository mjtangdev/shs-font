#!/bin/bash
# Increase Node memory limit for the build process
export NODE_OPTIONS=--max-old-space-size=8192

# ==============================================================================
# 所有环境配置列表 / Server URLs
# ==============================================================================
# 当前选中的 key（直接更改此处，或者在执行脚本时传入参数，如: ./build-latest.sh dev-82）
ACTIVE_ENV="${1:-prod}"

# 环境 URL 映射
get_server_url() {
  case "$1" in
    "local")    echo "http://localhost:8008/api/v1/" ;;
    "unknow")   echo "http://192.168.2.133:8000/api/v1/" ;;
    "ppalma")   echo "http://192.168.0.117:8000/api/v1/" ;;
    "prod")     echo "https://api.shstest.site/api/v1/" ;;
    "dev-82")   echo "http://192.168.10.82:8000/api/v1/" ;;
    "dev-200")  echo "http://192.168.200.65:8000/api/v1/" ;;
    "home-71")  echo "http://192.168.2.71:3000/api/v1/" ;;
    "dev-109")  echo "http://192.168.10.109:8000/api/v1/" ;;
    "dev-101")  echo "http://192.168.2.101:8000/api/v1/" ;;
    "dev-103")  echo "http://192.168.0.103:8000/api/v1/" ;;
    "magelco")  echo "http://172.16.11.114:8000/api/v1/" ;;
    http*://*)  echo "$1" ;; # 支持直接传入完整自定义 URL
    *)          echo "" ;;
  esac
}

# 获取最终选中的 API 地址
API_URL=$(get_server_url "$ACTIVE_ENV")

if [ -z "$API_URL" ]; then
  echo "[错误] 未知环境 key: '$ACTIVE_ENV'"
  echo "可用的 Key 列表: unknow | ppalma | prod | dev-82 | dev-200 | home-71 | dev-109 | dev-101 | dev-103 | dev-114"
  exit 1
fi

echo "=================================================="
echo " 正在构建 Docker 镜像: mjtangdev/shs-frontend:latest"
echo " 当前选中的 Key : $ACTIVE_ENV"
echo " API Base URL   : $API_URL"
echo "=================================================="

docker buildx build \
  --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_API_URL="$API_URL" \
  -t mjtangdev/shs-frontend:latest \
  --push \
  .
