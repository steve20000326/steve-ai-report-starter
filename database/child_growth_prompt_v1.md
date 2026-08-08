# 儿童成长 Prompt V1.5（Day3.5）

## type

`child_growth`

## 输出 JSON 格式（优先）

```json
{
  "title": "今天，他主动照顾了奶奶",
  "factSummary": "今天小宇第一次主动帮奶奶收拾碗筷……",
  "growthObservation": "这件小事背后，可能正在萌芽的是主动承担和关心他人……",
  "keywords": ["主动性", "关心他人"],
  "parentResponse": "可以直接使用的回应话术……",
  "nextSuggestion": "留下一个小期待……",
  "summary": "整体摘要"
}
```

## 兼容旧格式

仍支持 sections + suggestions 结构，解析层会自动映射到新字段。

## 建议 sections 结构（旧版）

| 章节 | 说明 |
|------|------|
| 事件观察 | 客观描述事件中孩子的行为与表现 |
| 发展亮点 | 从事件中看到的能力与成长 |
