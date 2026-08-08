/**
 * Report Engine 常量
 */

const REPORT_OUTPUT_SCHEMA = {
  title: '',
  summary: '',
  keywords: [],
  sections: [],
  suggestions: []
}

const PRODUCT_TYPES = {
  CHILD_GROWTH: 'child_growth',
  OLD_PHOTO_STORY: 'old_photo_story',
  CAREER_REPORT: 'career_report'
}

const REPORT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed'
}

const COLLECTIONS = {
  USERS: 'users',
  REPORTS: 'reports',
  REPORT_TEMPLATES: 'report_templates',
  ORDERS: 'orders',
  CHILDREN: 'children',
  QUOTAS: 'quotas'
}

const DEFAULT_FREE_QUOTA = 3

function isCollectionMissingError(err) {
  if (!err) return false
  const msg = String(err.message || err.errMsg || err)
  return (
    err.errCode === -502005 ||
    msg.indexOf('collection.get:fail') !== -1 ||
    msg.indexOf('collection.count:fail') !== -1 ||
    msg.indexOf('DATABASE_COLLECTION_NOT_EXIST') !== -1 ||
    msg.indexOf('Db or Table not exist') !== -1 ||
    msg.indexOf('ResourceNotFound') !== -1
  )
}

module.exports = {
  REPORT_OUTPUT_SCHEMA,
  PRODUCT_TYPES,
  REPORT_STATUS,
  COLLECTIONS,
  DEFAULT_FREE_QUOTA,
  isCollectionMissingError
}
