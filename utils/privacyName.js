/**
 * 姓名隐私处理
 * @param {string} name
 * @param {'full'|'mask'|'hide'} mode
 */
function formatNameForShare(name, mode) {
  const n = (name || '').trim()
  if (!n) return '孩子'
  if (mode === 'hide') return '孩子'
  if (mode === 'full') return n
  // mask (default)
  if (n.length === 1) return n + '*'
  if (n.length === 2) return n.charAt(0) + '*'
  return n.charAt(0) + '*' + n.charAt(n.length - 1)
}

module.exports = {
  formatNameForShare
}
