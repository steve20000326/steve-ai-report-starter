# old_photo_story Prompt V1

## type

`old_photo_story`

## 最高优先规则

1. 只能基于用户提供的事实进行故事整理
2. 绝对禁止自行新增：年份、地点、人物身份、关系、事件、对话、家庭经历、历史背景
3. 用户未提供的不猜、不补、不编
4. 允许：语言整理、结构组织、叙事润色、适量情绪、非事实性过渡句
5. story 约 400-700 中文字

## 输入 Schema

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

storyStyle: `documentary` | `warm` | `legacy`

## 输出 Schema

```json
{
  "title": "",
  "subtitle": "",
  "opening": "",
  "story": "",
  "memoryDetails": [],
  "closing": "",
  "shareExcerpt": "",
  "factNote": ""
}
```
