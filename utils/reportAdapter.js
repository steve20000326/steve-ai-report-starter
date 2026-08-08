/**
 * 报告展示适配层：兼容 child_growth 新结构与旧 sections 结构
 */

function pickSection(sections, index, fallback) {
  if (!Array.isArray(sections) || !sections[index]) return fallback || ''
  const s = sections[index]
  return (s.content || s.title || '').trim() || fallback || ''
}

function parseEventDateTs(report) {
  const eventDate = report.eventDate || (report.input && report.input.eventDate)
  if (eventDate) {
    const d = new Date(eventDate)
    if (!isNaN(d.getTime())) return d.getTime()
  }
  return report.createdAt || 0
}

function adaptChildGrowthReport(report) {
  const content = report.content || {}
  const sections = content.sections || report.sections || []
  const suggestions = content.suggestions || report.suggestions || []
  const keywords = content.keywords || report.keywords || []
  const childName = (report.input && report.input.name) || '孩子'

  const factSummary =
    content.factSummary ||
    report.factSummary ||
    pickSection(sections, 0, content.summary || report.summary || '')

  const growthObservation =
    content.growthObservation ||
    report.growthObservation ||
    pickSection(sections, 1, content.summary || report.summary || '')

  const parentResponse =
    content.parentResponse ||
    report.parentResponse ||
    (Array.isArray(suggestions) && suggestions[0] ? String(suggestions[0]) : '')

  const nextSuggestion =
    content.nextSuggestion ||
    report.nextSuggestion ||
    (Array.isArray(suggestions) && suggestions[1]
      ? String(suggestions[1])
      : parentResponse
        ? '明天也可以留意孩子有没有延续这份小进步。'
        : '')

  const warmSentence =
    content.warmSentence ||
    report.warmSentence ||
    '每一个小瞬间，都值得被温柔地留下。'

  const confidenceNote =
    content.confidenceNote || report.confidenceNote || ''

  const emotionTitle = content.title || report.title || '今天的成长瞬间'

  const eventDate = report.eventDate || (report.input && report.input.eventDate) || ''

  return {
    childName,
    pageTitle: childName + '的成长瞬间',
    emotionTitle,
    factSummary,
    growthObservation,
    keywords: keywords.slice(0, 3),
    parentResponse,
    nextSuggestion,
    warmSentence,
    confidenceNote,
    summary: content.summary || report.summary || growthObservation,
    eventDate,
    hasLegacySections: sections.length > 0 && !content.factSummary && !report.factSummary
  }
}

function groupReportsByMonth(reports) {
  const sorted = (reports || [])
    .slice()
    .sort((a, b) => parseEventDateTs(b) - parseEventDateTs(a))

  const groups = {}
  sorted.forEach((item) => {
    const ts = parseEventDateTs(item)
    if (!ts) return
    const d = new Date(ts)
    const key = d.getFullYear() + '年' + (d.getMonth() + 1) + '月'
    if (!groups[key]) {
      groups[key] = {
        month: key,
        sortKey: d.getFullYear() * 100 + d.getMonth(),
        items: []
      }
    }
    groups[key].items.push(item)
  })

  return Object.values(groups).sort((a, b) => b.sortKey - a.sortKey)
}

module.exports = {
  adaptChildGrowthReport,
  groupReportsByMonth,
  parseEventDateTs
}
