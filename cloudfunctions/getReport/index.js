const cloud = require('wx-server-sdk')
const { COLLECTIONS } = require('./lib/reportEngine')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { reportId } = event || {}

  if (!openid) {
    return { success: false, message: '用户未登录' }
  }

  if (!reportId) {
    return { success: false, message: '缺少参数 reportId' }
  }

  try {
    const result = await db.collection(COLLECTIONS.REPORTS).doc(reportId).get()
    const report = result.data

    if (!report) {
      return { success: false, message: '报告不存在' }
    }

    if (report.openid !== openid) {
      return { success: false, message: '无权查看该报告' }
    }

    return {
      success: true,
      message: '获取成功',
      data: {
        reportId: report._id,
        type: report.type,
        input: report.input,
        title: report.title,
        summary: report.summary,
        keywords: report.keywords || [],
        sections: report.sections || [],
        suggestions: report.suggestions || [],
        factSummary: report.factSummary || (report.content && report.content.factSummary) || '',
        growthObservation:
          report.growthObservation || (report.content && report.content.growthObservation) || '',
        parentResponse:
          report.parentResponse || (report.content && report.content.parentResponse) || '',
        nextSuggestion:
          report.nextSuggestion || (report.content && report.content.nextSuggestion) || '',
        warmSentence: report.warmSentence || (report.content && report.content.warmSentence) || '',
        confidenceNote:
          report.confidenceNote || (report.content && report.content.confidenceNote) || '',
        subtitle: report.subtitle || (report.content && report.content.subtitle) || '',
        opening: report.opening || (report.content && report.content.opening) || '',
        story: report.story || (report.content && report.content.story) || '',
        memoryDetails: report.memoryDetails || (report.content && report.content.memoryDetails) || [],
        closing: report.closing || (report.content && report.content.closing) || '',
        shareExcerpt: report.shareExcerpt || (report.content && report.content.shareExcerpt) || '',
        factNote: report.factNote || (report.content && report.content.factNote) || '',
        eventDate: report.eventDate || (report.input && report.input.eventDate) || '',
        childId: report.childId || '',
        status: report.status,
        content: report.content || null,
        retryCount: report.retryCount || 0,
        createdAt: report.createdAt
      }
    }
  } catch (err) {
    console.error('getReport error:', err)
    return {
      success: false,
      message: err.message || '获取报告失败'
    }
  }
}
