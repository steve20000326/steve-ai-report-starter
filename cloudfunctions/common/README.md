# 云函数公共模块（源码目录）

微信云函数**单独部署时只上传该函数目录**，`require('../common/xxx')` 在云端会失败。

## 使用方式

1. 在此目录维护公共代码
2. 运行同步脚本：

```bash
bash cloudfunctions/sync-common.sh
```

3. 重新部署相关云函数

## 已同步目标

- `createReport/lib/` — deepseek.js + reportEngine.js
- `getReport/lib/` — reportEngine.js
- `initReportTemplates/lib/` — reportEngine.js
