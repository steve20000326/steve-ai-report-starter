/**
 * 工作台产品 ID 与 Report Engine type 映射
 */

const PRODUCTS = {
  GROWTH: 'growth',
  COLLEGE: 'college',
  MEMORY: 'memory'
}

const REPORT_TYPE_BY_PRODUCT = {
  growth: 'child_growth',
  college: 'college_choice',
  memory: 'old_photo_story'
}

const PRODUCT_BY_REPORT_TYPE = {
  child_growth: 'growth',
  college_choice: 'college',
  old_photo_story: 'memory',
  career_report: 'college'
}

const PRODUCT_LABELS = {
  growth: 'AI儿童成长档案',
  college: 'AI高考志愿规划助手',
  memory: 'AI老照片故事'
}

function getReportType(product) {
  return REPORT_TYPE_BY_PRODUCT[product] || product
}

function getProduct(reportType, existingProduct) {
  if (existingProduct && PRODUCT_LABELS[existingProduct]) return existingProduct
  return PRODUCT_BY_REPORT_TYPE[reportType] || 'growth'
}

function getProductLabel(productOrType) {
  if (PRODUCT_LABELS[productOrType]) return PRODUCT_LABELS[productOrType]
  const product = PRODUCT_BY_REPORT_TYPE[productOrType]
  return product ? PRODUCT_LABELS[product] : 'AI 工具'
}

module.exports = {
  PRODUCTS,
  REPORT_TYPE_BY_PRODUCT,
  PRODUCT_BY_REPORT_TYPE,
  PRODUCT_LABELS,
  getReportType,
  getProduct,
  getProductLabel
}
