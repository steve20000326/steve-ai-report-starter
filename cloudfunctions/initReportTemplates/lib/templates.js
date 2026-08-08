/**
 * 默认报告模板（report_templates 集合种子数据）
 */

const { DEFAULT_TEMPLATES } = require('./promptService')

const DEFAULT_TEMPLATES_LIST = Object.keys(DEFAULT_TEMPLATES).map(function (key) {
  return DEFAULT_TEMPLATES[key]
})

function getDefaultTemplate(type) {
  return DEFAULT_TEMPLATES[type] || null
}

module.exports = {
  DEFAULT_TEMPLATES: DEFAULT_TEMPLATES_LIST,
  getDefaultTemplate
}
