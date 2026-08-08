/**
 * 通用工具函数
 */

function pad(n) {
  return n < 10 ? '0' + n : '' + n
}

/**
 * 格式化时间戳为可读字符串
 */
function formatTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return (
    date.getFullYear() +
    '-' +
    pad(date.getMonth() + 1) +
    '-' +
    pad(date.getDate()) +
    ' ' +
    pad(date.getHours()) +
    ':' +
    pad(date.getMinutes())
  )
}

function formatDate(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.getFullYear() + '年' + (date.getMonth() + 1) + '月' + date.getDate() + '日'
}

function formatDateShort(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return pad(date.getMonth() + 1) + '月' + pad(date.getDate()) + '日'
}

function daysBetween(fromTs, toTs) {
  if (!fromTs) return 0
  const start = new Date(fromTs)
  const end = toTs ? new Date(toTs) : new Date()
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  const diff = end.getTime() - start.getTime()
  return Math.max(1, Math.ceil(diff / (24 * 3600 * 1000)))
}

module.exports = {
  formatTime,
  formatDate,
  formatDateShort,
  daysBetween
}
