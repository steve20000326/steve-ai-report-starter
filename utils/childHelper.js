/**
 * 孩子信息辅助函数
 */

function calcAge(birthday, age) {
  if (age !== undefined && age !== null && age !== '') {
    return Number(age)
  }
  if (!birthday) return ''
  const birth = new Date(birthday)
  if (isNaN(birth.getTime())) return ''

  const now = new Date()
  let a = now.getFullYear() - birth.getFullYear()
  const monthDiff = now.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    a -= 1
  }
  return a >= 0 ? a : ''
}

function formatAgeText(birthday, age) {
  const a = calcAge(birthday, age)
  if (a === '') return '年龄未填写'
  return a + ' 岁'
}

function isSameMonth(ts, refDate) {
  if (!ts) return false
  const d = new Date(ts)
  const r = refDate || new Date()
  return d.getFullYear() === r.getFullYear() && d.getMonth() === r.getMonth()
}

function enrichChildWithReports(child, reports) {
  const childReports = (reports || []).filter(
    (r) => r.childId === child._id && (r.status === 'success' || r.status === 'completed')
  )
  const monthReports = childReports.filter((r) => isSameMonth(r.createdAt))
  const latest = childReports[0] || null

  return Object.assign({}, child, {
    ageText: formatAgeText(child.birthday, child.age),
    monthCount: monthReports.length,
    recentTitle: latest ? latest.title || '成长瞬间' : '还没有记录',
    recentDate: latest ? latest.createdAt : null
  })
}

module.exports = {
  calcAge,
  formatAgeText,
  isSameMonth,
  enrichChildWithReports
}
