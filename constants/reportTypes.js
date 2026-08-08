/**
 * 报告产品类型常量
 */

const PRODUCT_TYPES = {
  CHILD_GROWTH: 'child_growth',
  OLD_PHOTO_STORY: 'old_photo_story',
  CAREER_REPORT: 'career_report'
}

const PRODUCT_LABELS = {
  child_growth: '儿童成长报告',
  old_photo_story: '老照片故事',
  career_report: '人生选择报告'
}

function getProductLabel(type) {
  return PRODUCT_LABELS[type] || 'AI 报告'
}

module.exports = {
  PRODUCT_TYPES,
  PRODUCT_LABELS,
  getProductLabel
}
