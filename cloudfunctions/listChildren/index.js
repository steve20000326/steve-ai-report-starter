const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const COLLECTION = 'children'

function isCollectionMissingError(err) {
  if (!err) return false
  const msg = String(err.message || err.errMsg || err)
  return (
    err.errCode === -502005 ||
    msg.indexOf('collection.get:fail') !== -1 ||
    msg.indexOf('DATABASE_COLLECTION_NOT_EXIST') !== -1 ||
    msg.indexOf('Db or Table not exist') !== -1
  )
}

exports.main = async () => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!openid) {
    return { success: false, message: '用户未登录' }
  }

  try {
    const result = await db
      .collection(COLLECTION)
      .where({ userId: openid })
      .orderBy('createdAt', 'desc')
      .get()

    return {
      success: true,
      message: '获取成功',
      data: { list: result.data }
    }
  } catch (err) {
    console.error('listChildren error:', err)

    if (isCollectionMissingError(err)) {
      return {
        success: true,
        message: 'children 集合未创建，返回空列表',
        data: { list: [] }
      }
    }

    return {
      success: false,
      message: err.message || err.errMsg || '获取孩子列表失败'
    }
  }
}
