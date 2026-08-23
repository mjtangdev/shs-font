# 方案：适配 pnpm 构建流程

## 目标描述
将 Docker 构建流程从 `npm` 切换为 `pnpm`，以匹配开发环境并解决构建时的依赖同步错误。

## 用户审核要求

> [!IMPORTANT]
> **工具切换**：Dockerfile 将改用 `pnpm` 进行依赖安装和构建。
> **依赖锁定**：使用 `pnpm-lock.yaml` 确保生产环境依赖与本地开发完全一致。

## 拟议变更

### 1. Dockerfile 更新 [MODIFY]
#### [Dockerfile](file:///Users/tang/dev/shs/shs-font/Dockerfile)
- 增加 `pnpm` 安装步骤（利用 Node.js 自带的 `corepack`）。
- 将 `npm ci` 替换为 `pnpm install --frozen-lockfile`。
- 将 `npm run build` 替换为 `pnpm run build`。

### 2. 清理冗余文件 [DELETE]
- 删除了 `package-lock.json`，避免构建时产生歧义。

## 验证方案

### 自动验证
1. 运行 `/bin/bash build-latest.sh`。
2. 确认 Docker 构建过程中的 `pnpm install` 步骤能够顺利执行且不再报错“Missing lock file entry”。

**您是否批准这个“pnpm 构建适配”方案？批准后请继续运行构建脚本。**
