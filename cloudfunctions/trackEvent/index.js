const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const COLLECTION = 'usage_events'

const ALLOWED_EVENTS = [
  'app_open',
  'child_create',
  'record_start',
  'record_submit',
  'report_success',
  'report_view',
  'share_card_generate',
  'feedback_submit',
  'photo_upload',
  'memory_form_start',
  'memory_form_submit',
  'story_generate_success',
  'story_view'
]

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { event: eventName, productType, metadata } = event || {}

  if (!openid) {
    return { success: false, message: '用户未登录' }
  }

  if (!eventName || ALLOWED_EVENTS.indexOf(eventName) === -1) {
    return { success: false, message: '无效的事件类型' }
  }

  try {
    await db.collection(COLLECTION).add({
      data: {
        userId: openid,
        event: eventName,
        productType: productType || 'child_growth',
        metadata: metadata || {},
        createdAt: Date.now()
      }
    })
    return { success: true, message: 'ok' }
  } catch (err) {
    console.warn('trackEvent write skipped:', err.message)
    return { success: true, message: 'ok' }
  }
}
