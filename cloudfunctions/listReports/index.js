const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const COLLECTION = 'reports'

function isCollectionMissingError(err) {
  if (!err) return false
  const msg = String(err.message || err.errMsg || err)
  return (
    err.errCode === -502005 ||
    msg.indexOf('collection.get:fail') !== -1 ||
    msg.indexOf('collection.count:fail') !== -1 ||
    msg.indexOf('DATABASE_COLLECTION_NOT_EXIST') !== -1 ||
    msg.indexOf('Db or Table not exist') !== -1
  )
}

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { type, childId, page = 1, pageSize = 20 } = event || {}

  if (!openid) {
    return { success: false, message: '用户未登录' }
  }

  try {
    const query = { openid }
    if (type) query.type = type
    if (childId) query.childId = childId

    const skip = (page - 1) * pageSize

    const countResult = await db.collection(COLLECTION).where(query).count()
    const listResult = await db
      .collection(COLLECTION)
      .where(query)
      .orderBy('createdAt', 'desc')
      .skip(skip)
      .limit(pageSize)
      .field({
        title: true,
        summary: true,
        type: true,
        childId: true,
        status: true,
        keywords: true,
        eventDate: true,
        createdAt: true,
        input: true
      })
      .get()

    return {
      success: true,
      message: '获取成功',
      data: {
        list: listResult.data,
        total: countResult.total,
        page,
        pageSize
      }
    }
  } catch (err) {
    console.error('listReports error:', err)

    if (isCollectionMissingError(err)) {
      return {
        success: true,
        message: 'reports 集合未创建，返回空列表',
        data: { list: [], total: 0, page, pageSize }
      }
    }

    return {
      success: false,
      message: err.message || err.errMsg || '获取报告列表失败'
    }
  }
}
