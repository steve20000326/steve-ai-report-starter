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

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { name, birthday, age, gender } = event || {}

  if (!openid) {
    return { success: false, message: '用户未登录' }
  }

  if (!name || !String(name).trim()) {
    return { success: false, message: '请填写孩子姓名' }
  }

  const birthdayStr = birthday ? String(birthday).trim() : ''
  const ageStr = age !== undefined && age !== null && age !== '' ? String(age).trim() : ''

  if (!birthdayStr && !ageStr) {
    return { success: false, message: '请填写生日或年龄（至少一项）' }
  }

  if (ageStr && (isNaN(Number(ageStr)) || Number(ageStr) < 0 || Number(ageStr) > 18)) {
    return { success: false, message: '请填写合理的年龄（0-18岁）' }
  }

  try {
    const now = Date.now()
    const result = await db.collection(COLLECTION).add({
      data: {
        userId: openid,
        name: String(name).trim(),
        birthday: birthdayStr,
        age: ageStr ? Number(ageStr) : null,
        gender: gender ? String(gender).trim() : '',
        createdAt: now
      }
    })

    return {
      success: true,
      message: '添加成功',
      data: {
        childId: result._id,
        name: String(name).trim()
      }
    }
  } catch (err) {
    console.error('createChild error:', err)

    if (isCollectionMissingError(err)) {
      return {
        success: false,
        message: '请先在云开发控制台创建 children 集合'
      }
    }

    return {
      success: false,
      message: err.message || err.errMsg || '添加孩子失败'
    }
  }
}
