# Steve AI Report Starter 文档

## 目录说明

| 目录 | 说明 |
|------|------|
| pages / app.js 等 | 微信小程序前端代码（项目根目录） |
| cloudfunctions | 微信云函数 |
| database | 数据库 schema 设计文档 |
| config | 环境变量与配置示例 |
| docs | 项目文档 |

## 快速开始

1. 使用微信开发者工具打开本项目根目录
2. 开通云开发并创建环境
3. 复制 `config/env.example` 为 `.env`，填入云环境 ID 和 API Key
4. 在云开发控制台上传并部署云函数
5. 编译运行小程序

## 版本规划

- **Day1**：基础工程搭建（当前）
- **Day2**：数据库 + 用户体系 + Report Engine 骨架
- **Day3+**：业务功能迭代
