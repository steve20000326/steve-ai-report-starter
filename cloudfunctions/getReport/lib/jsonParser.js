/**
 * AI 响应 JSON 解析与校验（兼容 child_growth 新结构与通用 sections 结构）
 */

const {
  REPORT_OUTPUT_SCHEMA,
  CHILD_GROWTH_OUTPUT_SCHEMA,
  OLD_PHOTO_STORY_OUTPUT_SCHEMA
} = require('./reportEngine')

function parseJsonFromText(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('AI 返回内容为空')
  }

  const trimmed = text.trim()

  try {
    return JSON.parse(trimmed)
  } catch (e) {
    const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (codeBlockMatch) {
      return JSON.parse(codeBlockMatch[1].trim())
    }

    const objectMatch = trimmed.match(/\{[\s\S]*\}/)
    if (objectMatch) {
      return JSON.parse(objectMatch[0])
    }

    throw new Error('无法解析 AI 返回的 JSON')
  }
}

function validateGenericReportOutput(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('AI 输出不是有效 JSON 对象')
  }

  const requiredFields = ['title', 'summary', 'keywords', 'sections', 'suggestions']
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null) {
      throw new Error('AI 输出缺少字段: ' + field)
    }
  }

  if (typeof data.title !== 'string' || !data.title.trim()) {
    throw new Error('AI 输出 title 无效')
  }

  if (typeof data.summary !== 'string' || !data.summary.trim()) {
    throw new Error('AI 输出 summary 无效')
  }

  if (!Array.isArray(data.keywords)) {
    throw new Error('AI 输出 keywords 必须是数组')
  }

  if (!Array.isArray(data.sections)) {
    throw new Error('AI 输出 sections 必须是数组')
  }

  if (!Array.isArray(data.suggestions)) {
    throw new Error('AI 输出 suggestions 必须是数组')
  }

  return {
    title: data.title.trim(),
    summary: data.summary.trim(),
    keywords: data.keywords.map(String),
    sections: data.sections.map(function (section) {
      if (typeof section === 'string') {
        return { title: '', content: section }
      }
      return {
        title: String(section.title || ''),
        content: String(section.content || '')
      }
    }),
    suggestions: data.suggestions.map(String)
  }
}

function isChildGrowthNewFormat(data) {
  return !!(data.factSummary || data.growthObservation || data.parentResponse)
}

function validateChildGrowthOutput(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('AI 输出不是有效 JSON 对象')
  }

  if (isChildGrowthNewFormat(data)) {
    if (typeof data.title !== 'string' || !data.title.trim()) {
      throw new Error('AI 输出 title 无效')
    }
    if (typeof data.factSummary !== 'string' || !data.factSummary.trim()) {
      throw new Error('AI 输出 factSummary 无效')
    }
    if (typeof data.growthObservation !== 'string' || !data.growthObservation.trim()) {
      throw new Error('AI 输出 growthObservation 无效')
    }
    if (!Array.isArray(data.keywords)) {
      throw new Error('AI 输出 keywords 必须是数组')
    }

    const parentResponse = String(data.parentResponse || '').trim()
    const nextSuggestion = String(data.nextSuggestion || '').trim()
    const warmSentence = String(data.warmSentence || '').trim()
    const confidenceNote = String(data.confidenceNote || '').trim()
    const summary = String(data.summary || data.growthObservation || '').trim()

    if (!parentResponse) {
      throw new Error('AI 输出 parentResponse 无效')
    }

    return {
      title: data.title.trim(),
      factSummary: data.factSummary.trim(),
      growthObservation: data.growthObservation.trim(),
      keywords: data.keywords.map(String).slice(0, 4),
      parentResponse,
      nextSuggestion,
      warmSentence,
      confidenceNote,
      summary,
      sections: [
        { title: '今天发生了什么', content: data.factSummary.trim() },
        { title: '这件小事，让我们看见……', content: data.growthObservation.trim() }
      ],
      suggestions: [parentResponse, nextSuggestion].filter(Boolean)
    }
  }

  const legacy = validateGenericReportOutput(data)
  const factSummary =
    (legacy.sections[0] && legacy.sections[0].content) || legacy.summary
  const growthObservation =
    (legacy.sections[1] && legacy.sections[1].content) || legacy.summary

  return Object.assign({}, legacy, {
    factSummary,
    growthObservation,
    parentResponse: legacy.suggestions[0] || '',
    nextSuggestion: legacy.suggestions[1] || legacy.suggestions[0] || '',
    warmSentence: data.warmSentence ? String(data.warmSentence).trim() : '',
    confidenceNote: data.confidenceNote ? String(data.confidenceNote).trim() : ''
  })
}

/** @deprecated 保持兼容 */
function validateReportOutput(data) {
  return validateGenericReportOutput(data)
}

function validateOldPhotoStoryOutput(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('AI 输出不是有效 JSON 对象')
  }

  const required = ['title', 'subtitle', 'opening', 'story', 'closing', 'shareExcerpt']
  for (let i = 0; i < required.length; i++) {
    const field = required[i]
    if (!data[field] || !String(data[field]).trim()) {
      throw new Error('AI 输出缺少字段: ' + field)
    }
  }

  if (!Array.isArray(data.memoryDetails)) {
    throw new Error('AI 输出 memoryDetails 必须是数组')
  }

  const story = String(data.story).trim()
  if (story.length < 100) {
    throw new Error('AI 输出 story 过短')
  }

  return {
    title: String(data.title).trim(),
    subtitle: String(data.subtitle).trim(),
    opening: String(data.opening).trim(),
    story: story,
    memoryDetails: data.memoryDetails.map(String).slice(0, 8),
    closing: String(data.closing).trim(),
    shareExcerpt: String(data.shareExcerpt).trim(),
    factNote: data.factNote ? String(data.factNote).trim() : '',
    summary: String(data.shareExcerpt).trim(),
    keywords: [],
    sections: [],
    suggestions: []
  }
}

function parseReportJson(text, type) {
  const parsed = parseJsonFromText(text)
  if (type === 'child_growth') {
    return validateChildGrowthOutput(parsed)
  }
  if (type === 'old_photo_story') {
    return validateOldPhotoStoryOutput(parsed)
  }
  return validateGenericReportOutput(parsed)
}

module.exports = {
  REPORT_OUTPUT_SCHEMA,
  CHILD_GROWTH_OUTPUT_SCHEMA,
  parseJsonFromText,
  validateReportOutput,
  validateGenericReportOutput,
  validateChildGrowthOutput,
  validateOldPhotoStoryOutput,
  parseReportJson
}
