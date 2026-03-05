# OpenPrompt 重构设计文档

**日期**: 2026-03-05
**状态**: 已批准，待实施

## 背景

OpenPrompt 是一个 Prompt 与 Skill 管理工具。当前代码存在以下问题：

- 后端所有路由、业务逻辑写在单一 `server/src/index.ts` 中
- 前端所有组件、类型、状态写在单一 `web/src/App.tsx` 中
- 前端 API 地址硬编码为固定 IP
- 满屏 `any` 类型，无类型安全保障
- 缺少 DELETE 端点、按 ID 查询端点
- 无认证机制（写操作应受保护）
- `version` 字段存在但从未使用
- `tags` 字段存在但从未使用

## 目标

- 代码组织/可维护性：分层架构、类型安全
- 功能完善：补全缺失 API、错误/加载状态
- 生产就绪：环境变量配置、写操作认证
- 版本历史：每次保存自动快照

## 技术栈

保持不变：Fastify + Prisma + SQLite（后端），React + TanStack Query + Tailwind（前端）

---

## 第一节：后端架构

### 目录结构

```
server/src/
├── index.ts                  # 入口：注册插件、路由
├── config.ts                 # 读取环境变量（PORT, API_KEY）
├── lib/
│   └── prisma.ts             # PrismaClient 单例
├── middlewares/
│   └── auth.ts               # Bearer Token 校验（写操作前置钩子）
├── routes/
│   ├── prompts.ts            # Prompt 路由定义
│   └── skills.ts             # Skill 路由定义
└── services/
    ├── promptService.ts      # Prompt 业务逻辑
    └── skillService.ts       # Skill 业务逻辑
```

### API 端点

| Method | Path | Auth | 说明 |
|--------|------|------|------|
| GET | `/api/prompts` | - | 列表 |
| GET | `/api/prompts/:id` | - | 详情 |
| POST | `/api/prompts` | Bearer | 创建/更新 |
| DELETE | `/api/prompts/:id` | Bearer | 删除 |
| GET | `/api/prompts/:id/versions` | - | 版本历史 |
| GET | `/api/skills` | - | 列表 |
| GET | `/api/skills/:id` | - | 详情 |
| POST | `/api/skills` | Bearer | 创建/更新 |
| DELETE | `/api/skills/:id` | Bearer | 删除 |

### 认证方式

`.env` 中配置 `API_KEY=xxx`，写操作请求头需携带：

```
Authorization: Bearer xxx
```

---

## 第二节：前端架构

### 目录结构

```
web/src/
├── main.tsx
├── App.tsx                   # QueryClientProvider + 顶层布局
├── config.ts                 # baseURL 从 import.meta.env 读取
├── constants.ts              # CATEGORIES 等常量
├── types/
│   ├── prompt.ts             # Prompt, PromptVersion 类型
│   └── skill.ts              # Skill 类型
├── hooks/
│   ├── usePrompts.ts         # useQuery + useMutation 封装
│   └── useSkills.ts
└── components/
    ├── layout/
    │   └── Sidebar.tsx
    ├── prompts/
    │   ├── PromptCard.tsx
    │   ├── PromptEditor.tsx
    │   └── VersionHistory.tsx
    ├── skills/
    │   ├── SkillCard.tsx
    │   └── SkillEditor.tsx
    └── common/
        ├── CategoryTabs.tsx
        ├── ContentTypeToggle.tsx
        └── EmptyState.tsx
```

### 关键改进

| 问题 | 现状 | 改后 |
|------|------|------|
| 硬编码 IP | `http://192.210.243.20:3000` | `VITE_API_BASE_URL` 环境变量 |
| 满屏 `any` | `item: any`, `data: any` | 强类型 `Prompt`, `Skill` 接口 |
| 无错误/加载状态 | 静默失败 | 加载骨架屏 + 错误提示 |
| 无删除入口 | — | 卡片 hover 显示删除按钮 |
| 无版本历史入口 | — | 编辑器内「历史」按钮，侧滑显示 |
| 认证 token | — | 写操作自动附带 `Authorization` header |

---

## 第三节：数据模型变更

### 新增 `PromptVersion` 表

```prisma
model PromptVersion {
  id        String   @id @default(uuid())
  promptId  String
  version   Int
  content   String
  variables String   @default("[]")
  savedAt   DateTime @default(now())

  prompt    Prompt   @relation(fields: [promptId], references: [id], onDelete: Cascade)
}
```

### `Prompt` 表调整

- 新增 `versions PromptVersion[]` 关联
- 删除未使用的 `tags String?` 字段

### `Skill` 表调整

- 无结构变更，修复 API 层漏传 `type` 字段的问题

### 迁移策略

1. `prisma migrate dev` 生成迁移文件
2. `tags` 字段通过 SQLite 重建表删除，现有数据保留
3. `PromptVersion` 初始为空，后续保存时自动写入
