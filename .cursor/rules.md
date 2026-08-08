# Cursor Development Rules

## 项目上下文

本项目为 **Steve AI Report Starter V1**，一个可复用的 AI 报告型 SaaS 底座。
开发前请先阅读 `PROJECT_CONTEXT.md`。

## Coding Rules

- 使用微信小程序原生语法（WXML / WXSS / JS）
- 使用 JavaScript，不使用 TypeScript
- 保持代码简单，不引入不必要的框架
- 页面文件遵循四件套：`.js` `.json` `.wxml` `.wxss`
- 云函数遵循：`index.js` + `package.json` + `config.json`

## 目录约定

| 目录 | 用途 |
|------|------|
| pages/ | 页面 |
| components/ | 可复用组件 |
| utils/ | 纯工具函数 |
| services/ | 云函数 / API 调用封装 |
| constants/ | 常量定义 |
| cloudfunctions/ | 云函数（每个函数独立目录） |
| database/ | 数据库 schema 文档 |
| config/ | 环境变量示例 |

## Cloud Rules

- 所有 AI 调用必须通过云函数
- 禁止前端直接调用 DeepSeek API
- 云函数使用 `wx-server-sdk`
- 云函数环境变量通过云开发控制台配置，不硬编码

## Security Rules

禁止把 API Key 写入：

- `.js` 文件
- `.wxml` 文件
- `.wxss` 文件

所有密钥通过环境变量管理（参考 `config/env.example`）。

## Database Rules

- 数据库设计必须支持多个 AI 报告产品
- 使用 `type` 字段区分报告业务类型（如 `child_growth` / `old_photo_story` / `career_report`）
- 报告内容存储为结构化 JSON（`content` 字段）
- schema 文档维护在 `database/` 目录

## Development Style

- 优先 MVP，禁止过度设计
- Day1 阶段不实现业务逻辑，只做工程骨架
- 不提前开发三个具体产品
- 不调用真实 AI 接口（Day2 起接入）

## 页面路由

| 页面 | 路径 | tabBar |
|------|------|--------|
| 首页 | pages/index/index | ✅ |
| 添加孩子 | pages/child-add/child-add | ❌ |
| 创建记录 | pages/create/create | ❌ |
| 报告详情 | pages/report/report | ❌ |
| 成长时间线 | pages/timeline/timeline | ❌ |
| 报告列表 | pages/history/history | ✅ |
| 我的 | pages/mine/mine | ✅ |

## 云函数清单

| 函数 | 用途 |
|------|------|
| createReport | 创建/重试报告 |
| getReport | 获取单条报告 |
| listReports | 获取报告列表 |
| initReportTemplates | 初始化报告模板 |
| generateShareCard | 生成分享卡片 |
| checkQuota | 检查免费额度 |
| createChild | 添加孩子 |
| listChildren | 孩子列表 |

---

## V1 产品规则决策（2026-08-08）

### 1. 字段名：统一用 `type`

- 报告业务类型字段名为 `type`，不再使用 `productType`
- 示例值：`child_growth` / `old_photo_story` / `career_report`

### 2. 报告状态 `status`

| status | 含义 | 时间线展示 | 详情页 |
|--------|------|-----------|--------|
| `generating` | AI 生成中 | 标题「报告生成中…」，样式弱化 | 加载中页，轮询状态 |
| `failed` | 生成失败 | 标题「生成失败，可重试」 | 展示原始输入 +「重新生成报告」按钮 |
| `success` | 生成成功 | 正常展示报告标题/摘要 | 完整报告内容 |

- 兼容旧值：`pending` → `generating`，`completed` → `success`
- 失败重试：`retryCount` 上限 3 次（见 `quotaConfig.js` / `constants/quota.js`）

### 3. 孩子信息必填项

| 字段 | 是否必填 |
|------|---------|
| 姓名 | 必填 |
| 性别 | 必填（默认「未知」） |
| 生日 | **选填，但强烈推荐填写**（用于计算年龄） |

### 4. 免费额度

**产品规则：**

- 每个新用户默认 **3 次** 免费 AI 报告生成额度
- 仅当报告 `status = success` 时扣减 1 次
- 额度用完后：
  - 仍可记录事件（纯文本备忘，V1 暂未单独实现）
  - 不能再生成新的 AI 报告（按钮提示「免费额度已用完」/「开通完整版后可继续生成」）

**技术实现：**

- `users.freeQuota` 字段，新用户默认 `3`
- `createReport` 入口检查额度，不足返回 `FREE_QUOTA_EXCEEDED`
- 配置常量：`cloudfunctions/common/quotaConfig.js` → `DEFAULT_FREE_QUOTA: 3`
- 修改默认次数：改 `quotaConfig.js` + 本文档 + `constants/quota.js` 三处保持一致
