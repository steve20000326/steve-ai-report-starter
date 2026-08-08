# Steve AI Report Starter V1

## 项目目标

建立一个可复用的 AI 报告型 SaaS 开发底座。

未来支持：

1. AI 儿童成长档案（child_growth）
2. AI 老照片故事（old_photo_story）
3. AI 高考人生选择报告（career_report）

以及其他 AI 报告类产品。

## 技术架构

| 层级 | 技术 |
|------|------|
| 前端 | 微信小程序原生开发（JavaScript） |
| 后端 | 微信云开发（Cloud Functions） |
| 数据库 | CloudBase NoSQL |
| AI | DeepSeek API（仅云函数调用） |

## 目录结构

```
steve-ai-report-starter/
├── pages/                # 小程序页面
├── components/           # 公共组件
├── utils/                # 工具函数
├── services/             # 云函数调用封装
├── constants/            # 常量
├── assets/               # 静态资源
├── app.js / app.json     # 小程序入口
├── cloudfunctions/       # 云函数
├── database/             # 数据库 schema 文档
├── config/               # 环境变量示例
├── docs/                 # 项目文档
└── project.config.json   # 微信开发者工具配置
```

## 核心原则

1. 不为单个产品开发独立架构
2. 所有产品复用 Report Engine
3. AI 输出必须结构化 JSON
4. API Key 禁止写入代码
5. 所有配置使用环境变量

## 当前版本目标（V1）

- 用户体系
- 报告生成
- 报告保存
- 历史查看
- 分享卡片
- 免费额度控制

## 产品类型字段

| 值 | 产品 |
|----|------|
| child_growth | AI 儿童成长档案 |
| old_photo_story | AI 老照片故事 |
| career_report | AI 高考人生选择报告 |

## 开发进度

| 阶段 | 内容 | 状态 |
|------|------|------|
| Day1 | 基础工程搭建 | ✅ 完成 |
| Day2 | 报告生成闭环（createReport + 报告展示） | ✅ 完成 |
| Day3 | 儿童成长档案 MVP + Report Engine 模板化 | ✅ 完成 |
| Day4+ | 分享卡片、支付、其他产品 | 待开始 |
