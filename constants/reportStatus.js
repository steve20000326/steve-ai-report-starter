/**
 * 报告状态常量与展示文案
 */

const REPORT_STATUS = {
  GENERATING: 'generating',
  SUCCESS: 'success',
  FAILED: 'failed'
}

/** 兼容旧 status 值 */
function normalizeStatus(status) {
  if (status === 'pending') return REPORT_STATUS.GENERATING
  if (status === 'completed') return REPORT_STATUS.SUCCESS
  return status || ''
}

function isSuccess(status) {
  return normalizeStatus(status) === REPORT_STATUS.SUCCESS
}

function getTimelineItem(status) {
  const s = normalizeStatus(status)
  if (s === REPORT_STATUS.GENERATING) {
    return {
      title: '正在整理中…',
      subtitle: 'AI 正在帮你整理这个成长瞬间。',
      statusText: '整理中'
    }
  }
  if (s === REPORT_STATUS.FAILED) {
    return {
      title: '整理未完成，可重试',
      subtitle: '原始记录还在，点此重新整理。',
      statusText: '未完成'
    }
  }
  return {
    title: '',
    subtitle: '',
    statusText: '已记录'
  }
}

module.exports = {
  REPORT_STATUS,
  normalizeStatus,
  isSuccess,
  getTimelineItem
}
