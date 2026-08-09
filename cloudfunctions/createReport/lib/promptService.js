/**
 * Prompt 模板服务：读取 report_templates，构建 DeepSeek 消息
 */

const {
  REPORT_OUTPUT_SCHEMA,
  OLD_PHOTO_STORY_OUTPUT_SCHEMA
} = require('./reportEngine')

const STORY_STYLE_LABELS = {
  documentary: '平实纪实',
  warm: '温暖回忆',
  legacy: '写给下一代'
}

const DEFAULT_TEMPLATES = {
  child_growth: {
    type: 'child_growth',
    name: '儿童成长档案',
    enabled: true,
    version: 'v1.1',
    systemPrompt: [
      '你是一名温和、克制的儿童成长记录助手，帮助父母看见孩子日常小事里的成长信号。',
      '',
      '必须遵循：',
      '1. 严格区分「事实描述」与「成长观察推断」，factSummary 只写客观发生的事。',
      '2. 不通过一次事件给孩子形成固定人格判断，禁止贴标签式结论。',
      '3. 禁止过度拔高，语气温暖但克制。',
      '4. parentResponse 必须具体、可直接使用，禁止只写「多鼓励孩子」等空泛建议。',
      '5. 报告总体长度适合手机阅读，各段落精炼。',
      '6. 证据不足时，confidenceNote 需明确：这只是一次成长观察，还不能形成稳定判断。',
      '',
      '不做医疗诊断，使用简体中文。'
    ].join('\n'),
    userPromptTemplate: [
      '请根据家长记录的一次成长小事，整理成一份「成长瞬间」：',
      '',
      '【孩子】{{name}}，{{age}}岁，{{gender}}',
      '【日期】{{eventDate}}',
      '{{eventTagLine}}',
      '【家长记录】{{description}}',
      '{{parentNoteLine}}',
      '',
      '请温暖、克制地整理，区分事实与推断。'
    ].join('\n')
  },
  old_photo_story: {
    type: 'old_photo_story',
    name: 'AI老照片故事',
    enabled: true,
    version: 'v1',
    systemPrompt: [
      '你是一名老照片故事整理者，帮助用户把真实记忆整理成值得留下的文字。',
      '',
      '最高优先规则：',
      '1. 只能基于用户提供的事实进行故事整理，绝对禁止自行新增：年份、地点、人物身份、人物关系、具体事件、具体对话、家庭经历、历史背景事实。',
      '2. 如果用户没有提供，不要猜、不要补全、不要编造。',
      '3. 允许：语言整理、结构组织、叙事润色、适量情绪表达、合理的非事实性过渡句（如「那时候的日子，总是过得慢一些」）。',
      '4. 不能为了「感人」而编故事。',
      '5. story 正文约 400-700 中文字，适合移动端阅读。',
      '6. factNote 需说明：本故事仅基于用户提供的记忆整理，未添加未提及的事实。',
      '',
      '使用简体中文。'
    ].join('\n'),
    userPromptTemplate: [
      '请根据以下用户提供的记忆，整理一段老照片故事。',
      '写作风格：{{storyStyleLabel}}',
      '',
      '【用户提供的信息】',
      '大约年份：{{approxYear}}',
      '照片里都是谁：{{people}}',
      '{{locationLine}}',
      '{{photographerLine}}',
      '核心记忆：{{memory}}',
      '{{extraLine}}',
      '',
      '请严格基于以上信息整理，不要添加用户未提及的事实。'
    ].join('\n')
  },
  career_report: {
    type: 'career_report',
    name: '人生选择报告',
    enabled: true,
    systemPrompt:
      '你是一名职业规划与人生决策顾问，擅长根据用户描述的选择情境，生成理性、全面的人生选择分析报告。',
    userPromptTemplate:
      '请根据以下信息生成人生选择报告：\n姓名：{{name}}\n年龄：{{age}}\n选择情境描述：{{description}}'
  }
}

function renderTemplate(template, variables) {
  if (!template) return ''
  return template.replace(/\{\{(\w+)\}\}/g, function (_, key) {
    const value = variables[key]
    return value === undefined || value === null ? '' : String(value)
  })
}

function getOutputSchema(type) {
  if (type === 'child_growth') {
    return CHILD_GROWTH_OUTPUT_SCHEMA
  }
  if (type === 'old_photo_story') {
    return OLD_PHOTO_STORY_OUTPUT_SCHEMA
  }
  return REPORT_OUTPUT_SCHEMA
}

function getOutputFieldDocs(type) {
  if (type === 'child_growth') {
    return [
      '- title: 带情绪的成长标题（15字以内）',
      '- factSummary: 客观事实摘要（60-100字），只描述发生了什么',
      '- growthObservation: 成长观察（80-120字），温和推断，不过度拔高',
      '- keywords: 成长关键词 2-3 个',
      '- parentResponse: 父母可直接使用的具体回应话术（60-100字）',
      '- nextSuggestion: 留下一个小期待（30-60字）',
      '- warmSentence: 一句温暖的纪念语（20-40字）',
      '- confidenceNote: 置信说明；证据不足时写「这只是一次成长观察，还不能形成稳定判断」',
      '- summary: 整体摘要，可与 growthObservation 相近'
    ].join('\n')
  }

  if (type === 'old_photo_story') {
    return [
      '- title: 故事标题（15字以内）',
      '- subtitle: 副标题，如年代/季节感（20字以内）',
      '- opening: 开篇段落（80-120字）',
      '- story: 正文故事（400-700中文字）',
      '- memoryDetails: 用户记忆要点数组，2-5条，只复述用户提供的信息',
      '- closing: 收束段落（60-100字）',
      '- shareExcerpt: 分享摘要（40-80字）',
      '- factNote: 事实说明，声明未添加未提及的内容'
    ].join('\n')
  }

  return [
    '- title: 报告标题（15字以内）',
    '- summary: 报告摘要（100-200字）',
    '- keywords: 关键词数组，3-5个',
    '- sections: 章节数组，每项包含 title 和 content，3-4个章节',
    '- suggestions: 建议数组，3-5条'
  ].join('\n')
}

function buildPromptMessages(template, input, type) {
  const reportType = type || template.type || 'child_growth'
  const outputExample = JSON.stringify(getOutputSchema(reportType), null, 2)

  const enrichedInput = Object.assign({}, input, {
    eventTagLine: input.eventTag ? '【标签】' + input.eventTag : '',
    parentNoteLine: input.parentNote ? '【家长补充】' + input.parentNote : '',
    storyStyleLabel: STORY_STYLE_LABELS[input.storyStyle] || STORY_STYLE_LABELS.warm,
    locationLine: input.location ? '地点：' + input.location : '',
    photographerLine: input.photographer ? '拍摄者：' + input.photographer : '',
    extraLine: input.extraDetail ? '补充细节：' + input.extraDetail : ''
  })

  const systemPrompt = [
    template.systemPrompt || '你是一名专业的 AI 报告生成助手。',
    '',
    '你必须严格输出 JSON，不要输出任何其他文字。',
    '输出格式如下：',
    outputExample,
    '',
    '字段说明：',
    getOutputFieldDocs(reportType)
  ].join('\n')

  const userPrompt = renderTemplate(template.userPromptTemplate, enrichedInput)

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ]
}

function getInlineTemplate(type) {
  return DEFAULT_TEMPLATES[type] || null
}

async function getReportTemplate(db, type) {
  const inlineTemplate = getInlineTemplate(type)
  if (!inlineTemplate) {
    throw new Error('未支持的报告类型: ' + type)
  }

  const COLLECTION = 'report_templates'

  try {
    const result = await db.collection(COLLECTION).where({ type }).limit(1).get()

    if (result.data.length) {
      return result.data[0]
    }

    const now = Date.now()
    const templateData = Object.assign({}, inlineTemplate, {
      createdAt: now,
      updatedAt: now
    })

    try {
      const addResult = await db.collection(COLLECTION).add({ data: templateData })
      return Object.assign({ _id: addResult._id }, templateData)
    } catch (writeErr) {
      console.warn('template write skipped:', writeErr.message)
      return templateData
    }
  } catch (readErr) {
    console.warn('template read skipped, use inline:', readErr.message)
    return inlineTemplate
  }
}

module.exports = {
  DEFAULT_TEMPLATES,
  renderTemplate,
  buildPromptMessages,
  getInlineTemplate,
  getReportTemplate
}
