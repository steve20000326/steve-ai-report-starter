const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const DEFAULT_FREE_QUOTA = Number(process.env.DEFAULT_FREE_QUOTA) || 3

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

async function getOrInitUser(openid) {
  const users = db.collection('users')
  const existing = await users.where({ openid }).limit(1).get()

  if (existing.data.length) {
    return existing.data[0]
  }

  const now = Date.now()
  const data = {
    openid,
    nickName: '',
    avatarUrl: '',
    freeQuota: DEFAULT_FREE_QUOTA,
    createdAt: now,
    updatedAt: now
  }
  const addResult = await users.add({ data })
  return Object.assign({ _id: addResult._id }, data)
}

exports.main = async () => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!openid) {
    return { success: false, message: '用户未登录' }
  }

  try {
    const user = await getOrInitUser(openid)
    const remaining = typeof user.freeQuota === 'number' ? user.freeQuota : DEFAULT_FREE_QUOTA
    return {
      success: true,
      message: '获取成功',
      data: {
        totalQuota: DEFAULT_FREE_QUOTA,
        usedQuota: DEFAULT_FREE_QUOTA - remaining,
        remainingQuota: Math.max(0, remaining),
        canCreate: remaining > 0
      }
    }
  } catch (err) {
    console.error('checkQuota error:', err)
    if (isCollectionMissingError(err)) {
      return {
        success: false,
        message: '请先在云开发控制台创建 users 集合'
      }
    }
    return {
      success: false,
      message: err.message || err.errMsg || '获取额度失败'
    }
  }
}
