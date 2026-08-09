/**
 * 报告产品类型常量（Report Engine type）
 * 工作台 product 见 constants/products.js
 */

const { PRODUCTS, getProduct, getProductLabel } = require('./products')

const PRODUCT_TYPES = {
  CHILD_GROWTH: 'child_growth',
  OLD_PHOTO_STORY: 'old_photo_story',
  COLLEGE_CHOICE: 'college_choice',
  CAREER_REPORT: 'career_report'
}

const PRODUCT_LABELS = {
  child_growth: '儿童成长报告',
  old_photo_story: '老照片故事',
  college_choice: '高考志愿报告',
  career_report: '人生选择报告'
}

function getReportTypeLabel(type) {
  return PRODUCT_LABELS[type] || 'AI 报告'
}

module.exports = {
  PRODUCTS,
  PRODUCT_TYPES,
  PRODUCT_LABELS,
  getProduct,
  getProductLabel,
  getReportTypeLabel
}
