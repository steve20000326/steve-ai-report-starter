const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const COLLECTION = 'feedback'

const ALLOWED_RATINGS = ['helpful', 'normal', 'not_helpful']

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { reportId, rating, comment } = event || {}

  if (!openid) {
    return { success: false, message: '用户未登录' }
  }

  if (!reportId) {
    return { success: false, message: '缺少 reportId' }
  }

  if (!rating || ALLOWED_RATINGS.indexOf(rating) === -1) {
    return { success: false, message: '请选择反馈评价' }
  }

  const commentText = comment ? String(comment).trim().slice(0, 200) : ''

  try {
    const reportResult = await db.collection('reports').doc(reportId).get()
    const report = reportResult.data
    if (!report || report.openid !== openid) {
      return { success: false, message: '报告不存在或无权访问' }
    }

    await db.collection(COLLECTION).add({
      data: {
        userId: openid,
        reportId,
        rating,
        comment: commentText,
        createdAt: Date.now()
      }
    })

    return { success: true, message: '感谢你的反馈' }
  } catch (err) {
    console.error('submitFeedback error:', err)
    return {
      success: false,
      message: err.message || '提交反馈失败'
    }
  }
}
