# SHS - Solar Home System Frontend | 太阳能家庭系统前端

> **Quick Docker Build (Cross-platform) | 快速跨平台打包命令**:
> ```bash
> # Build for Linux amd64 (Intel/AMD) from any platform
> docker buildx build \
> --platform linux/amd64 \
> --build-arg NEXT_PUBLIC_API_URL=https://api.shstest.site/api/v1 \
> -t mjtangdev/shs-frontend:latest \
> --push \
> .
> ```

A modern, high-performance web interface for managing Solar Home Systems, built with Next.js 16, React 19, and Tailwind CSS 4.
一个基于 Next.js 16、React 19 和 Tailwind CSS 4 构建的现代化、高性能太阳能家庭系统管理界面。

---

## 🌟 Features | 功能特性

- **Security First | 安全至上**: Mandatory default password update upon first login to ensure system integrity. | 首次登录强制修改默认密码，确保系统安全性。
- **System Setup | 系统初始化**: Streamlined onboarding workflow for region selection and provider configuration. | 引导式的区域选择与供应商配置流程，简化系统上线。
- **Real-time Monitoring | 实时监控**: Comprehensive dashboard with interactive charts for solar device performance tracking. | 功能齐全的仪表盘，通过交互式图表实时追踪太阳能设备运行状态。
- **Modern UI | 现代化界面**: Sophisticated design using shadcn/ui and Tailwind CSS 4, with full dark/light mode support. | 使用 shadcn/ui 和 Tailwind CSS 4 打造的精美界面，支持完善的深色/浅色模式切换。
- **Authentication & Authorization | 权限管理**: Robust JWT-based auth flow with role-based access control. | 基于 JWT 的稳健身份验证机制，支持基于角色的访问控制。

## 🛠 Tech Stack | 技术栈

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **Core Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/), [Lucide React](https://lucide.dev/)
- **Data Handling**: [Axios](https://axios-http.com/), [js-cookie](https://github.com/js-cookie/js-cookie)
- **Visualization**: [Recharts](https://recharts.org/)

## 🚀 Getting Started | 快速开始

### Prerequisites | 环境要求

- Node.js 20+
- npm / pnpm / yarn / bun

### Installation | 安装

```bash
# Clone the repository | 克隆仓库
git clone <repository-url>

# Install dependencies | 安装依赖
npm install
```

### Environment Variables | 环境变量

Create a `.env.local` file in the root directory:
在根目录创建 `.env.local` 文件：

```env
NEXT_PUBLIC_API_URL=http://your-api-base-url/api/v1
```

### Development | 开发

```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
在浏览器中打开 [http://localhost:3000](http://localhost:3000) 查看结果。

### Build | 构建

```bash
# Build for production | 生产环境构建
npm run build

# Start production server | 启动生产服务器
npm run start
```

## 📂 Project Structure | 项目结构

- `src/app`: Next.js App Router pages and layouts (auth, admin, dashboard). | Next.js 页面与路由管理（认证、管理、仪表盘）。
- `src/components`: Reusable UI components and business logic components. | 可复用的 UI 组件及业务逻辑组件。
- `src/lib`: Utilities, API clients (Axios), and shared logic. | 工具类、API 客户端（Axios）和共享逻辑。
- `src/proxy.ts`: Authentication and system initialization guard. | 身份验证与系统初始化状态守卫。
- `public/`: Static assets such as images and fonts. | 静态资源，如图片和字体。

## 📄 License | 开源协议

This project is private and proprietary. All rights reserved.
本项目为私有且专有。版权所有。
