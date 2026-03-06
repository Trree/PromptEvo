# Prompt Manager

[English](./README.md)

Prompt Manager 是一个用于统一管理 Prompt 和 Skill 资产的全栈应用。

## 功能特性

- 统一资产库：`Prompt` 与 `Skill`
- 支持搜索、筛选、标签、收藏、最近使用
- Prompt 版本历史管理
- Prompt/Skill 的隐藏与删除
- 写操作支持 API Key 鉴权
- 基于 SQLite + Prisma 的后端存储

## 技术栈

- 后端：Fastify + TypeScript + Prisma + SQLite
- 前端：React + Vite + TanStack Query + Tailwind CSS

## 项目结构

```text
.
├── server/          # Fastify API
├── web/             # React 前端（Vite）
├── prisma/          # Prisma schema
├── deploy/          # systemd 服务文件
└── DEPLOYMENT.md    # 生产部署说明
```

## 环境要求

- Node.js 20+
- npm 10+

## 本地启动

1. 安装依赖：

```bash
npm ci
npm ci --prefix web
```

2. 创建环境变量文件：

```bash
cp .env.example .env
```

3. 生成 Prisma Client 并同步数据库结构：

```bash
npm run prisma:generate
npm run db:push
```

4. 启动开发环境：

```bash
npm run dev
```

- API 服务：`http://localhost:3000`
- Web 前端：Vite 默认 `http://localhost:5173`

## 构建与运行

```bash
npm run build
npm run start
```

## 环境变量

- `DATABASE_URL`：SQLite 连接串
- `PORT`：API 端口（默认 `3000`）
- `HOST`：API 监听地址（默认 `0.0.0.0`）
- `API_KEY`：设置后写操作需携带 `Authorization: Bearer <API_KEY>`

## API 概览

### Prompts

- `GET /api/prompts`
- `GET /api/prompts/:id`
- `GET /api/prompts/:id/versions`
- `POST /api/prompts`（需鉴权）
- `POST /api/prompts/:id/hide`（需鉴权）
- `DELETE /api/prompts/:id`（需鉴权）

### Skills

- `GET /api/skills`
- `POST /api/skills`（需鉴权）
- `POST /api/skills/:id/hide`（需鉴权）
- `DELETE /api/skills/:id`（需鉴权）

## 生产部署

### 一键部署（Debian/Ubuntu）

在项目根目录执行：

```bash
sudo bash deploy/one-click.sh
```

可选环境变量（覆盖默认值）：

```bash
sudo API_KEY='your-strong-secret' PORT=3000 HOST=0.0.0.0 bash deploy/one-click.sh
```

脚本会自动完成：安装 Node.js 20、初始化运行目录、写入 `/etc/prompt-manager/prompt-manager.env`、构建项目、并启动 `prompt-manager` systemd 服务。

参考 [DEPLOYMENT.md](./DEPLOYMENT.md) 与 [deploy/prompt-manager.service](./deploy/prompt-manager.service)。
