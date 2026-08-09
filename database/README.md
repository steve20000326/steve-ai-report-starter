# 数据库集合设计

## 初始化步骤

1. 云开发控制台创建集合：`users`、`reports`、`report_templates`、`orders`、`children`、`usage_events`、`feedback`
2. 运行 `bash cloudfunctions/sync-common.sh`，部署全部云函数
3. 部署后运行 `initReportTemplates`（写入缺失模板）
4. 配置云函数环境变量 `DEEPSEEK_API_KEY`

---

## usage_events（Day4 新增）

最小行为统计

| 字段 | 类型 | 说明 |
|------|------|------|
| userId | string | 用户 openid |
| event | string | 事件名（见下方列表） |
| productType | string | 默认 child_growth |
| metadata | object | 附加信息 |
| createdAt | number | 时间戳 |

**允许的事件：** app_open, child_create, record_start, record_submit, report_success, report_view, share_card_generate, feedback_submit

---

## feedback（Day4 新增）

成长报告反馈

| 字段 | 类型 | 说明 |
|------|------|------|
| userId | string | 用户 openid |
| reportId | string | 报告 ID |
| rating | string | helpful / normal / not_helpful |
| comment | string | 评论（200字以内） |
| createdAt | number | 时间戳 |

---

## reports（Day4 更新，Day5.5 增加 product）

新增字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| product | string | 工作台产品 ID：`growth` / `college` / `memory`（Day5.5） |
| eventDate | string | 事件日期 YYYY-MM-DD（时间线排序用） |
| warmSentence | string | 温暖纪念语 |
| confidenceNote | string | 置信说明 |

**product 与 type 映射：**

| product | type（Report Engine） |
|---------|-------------------------|
| growth | child_growth |
| college | college_choice |
| memory | old_photo_story |

旧数据无 `product` 字段时，按 `type` 推断，保持兼容。


input 统一结构：

```json
{
  "childId": "",
  "eventText": "",
  "eventTag": "",
  "eventDate": "",
  "parentNote": ""
}
```

---

## children（Day4 更新）

| 字段 | 必填 | 说明 |
|------|------|------|
| name | 是 | 姓名/小名 |
| birthday | 二选一 | 生日 |
| age | 二选一 | 年龄 |
| gender | 否 | 性别 |

---

## 其他集合

见 Day2/Day3 文档：`users`、`report_templates`、`orders`

## 已废弃

- `quotas` 集合：额度在 `users.freeQuota`

---

## old_photo_story（Day5 新增）

业务 type: `old_photo_story`

详见 `database/old_photo_story_prompt_v1.md`

**输入 input：**
```json
{
  "photoFileId": "",
  "approxYear": "",
  "people": "",
  "location": "",
  "memory": "",
  "extraDetail": "",
  "storyStyle": "warm"
}
```

**输出字段：** subtitle, opening, story, memoryDetails, closing, shareExcerpt, factNote

**Quota：** 第一篇老照片故事免费，之后消耗 `users.freeQuota`

**照片存储：** 微信云存储 `old-photos/`，仅存 cloudFileId，禁止 base64 入库
