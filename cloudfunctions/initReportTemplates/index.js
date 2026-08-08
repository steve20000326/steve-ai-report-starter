const cloud = require('wx-server-sdk')
const { COLLECTIONS } = require('./lib/reportEngine')
const { DEFAULT_TEMPLATES } = require('./lib/promptService')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async () => {
  const collection = db.collection(COLLECTIONS.REPORT_TEMPLATES)
  let created = 0

  for (const key of Object.keys(DEFAULT_TEMPLATES)) {
    const template = DEFAULT_TEMPLATES[key]
    const existing = await collection.where({ type: template.type }).limit(1).get()

    if (existing.data.length) {
      continue
    }

    const now = Date.now()
    await collection.add({
      data: Object.assign({}, template, { createdAt: now, updatedAt: now })
    })
    created += 1
  }

  return {
    success: true,
    message: created ? 'report_templates 初始化完成' : '模板已存在，跳过初始化',
    data: { count: created }
  }
}
