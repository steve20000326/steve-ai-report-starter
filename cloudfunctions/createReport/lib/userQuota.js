/**
 * 用户免费额度（users.freeQuota）
 */

const { COLLECTIONS, isCollectionMissingError } = require('./reportEngine')
const { DEFAULT_FREE_QUOTA } = require('./quotaConfig')

function getDefaultQuotaValue() {
  const envVal = Number(process.env.DEFAULT_FREE_QUOTA)
  return envVal > 0 ? envVal : DEFAULT_FREE_QUOTA
}

async function getOrInitUser(db, openid) {
  const users = db.collection(COLLECTIONS.USERS)
  const existing = await users.where({ openid }).limit(1).get()

  if (existing.data.length) {
    const user = existing.data[0]
    if (typeof user.freeQuota !== 'number') {
      const defaultQuota = getDefaultQuotaValue()
      await users.doc(user._id).update({
        data: { freeQuota: defaultQuota, updatedAt: Date.now() }
      })
      user.freeQuota = defaultQuota
    }
    return user
  }

  const now = Date.now()
  const defaultQuota = getDefaultQuotaValue()
  const data = {
    openid,
    nickName: '',
    avatarUrl: '',
    freeQuota: defaultQuota,
    createdAt: now,
    updatedAt: now
  }
  const addResult = await users.add({ data })
  return Object.assign({ _id: addResult._id }, data)
}

async function checkUserQuota(db, openid) {
  try {
    const user = await getOrInitUser(db, openid)
    const total = getDefaultQuotaValue()
    const remaining = typeof user.freeQuota === 'number' ? user.freeQuota : total
    return {
      totalQuota: total,
      usedQuota: total - remaining,
      remainingQuota: Math.max(0, remaining),
      canCreate: remaining > 0
    }
  } catch (err) {
    if (isCollectionMissingError(err)) {
      throw new Error('请先在云开发控制台创建 users 集合')
    }
    throw err
  }
}

async function consumeUserQuota(db, openid) {
  const user = await getOrInitUser(db, openid)
  const remaining = typeof user.freeQuota === 'number' ? user.freeQuota : getDefaultQuotaValue()

  if (remaining <= 0) {
    const err = new Error('免费额度已用完')
    err.code = 'FREE_QUOTA_EXCEEDED'
    throw err
  }

  const _ = db.command
  const updateResult = await db
    .collection(COLLECTIONS.USERS)
    .where({
      _id: user._id,
      freeQuota: _.gt(0)
    })
    .update({
      data: {
        freeQuota: _.inc(-1),
        updatedAt: Date.now()
      }
    })

  if (!updateResult.stats || updateResult.stats.updated === 0) {
    const err = new Error('免费额度已用完')
    err.code = 'FREE_QUOTA_EXCEEDED'
    throw err
  }

  const newRemaining = remaining - 1
  const total = getDefaultQuotaValue()
  return {
    totalQuota: total,
    usedQuota: total - newRemaining,
    remainingQuota: newRemaining,
    canCreate: newRemaining > 0
  }
}

module.exports = {
  getOrInitUser,
  checkUserQuota,
  consumeUserQuota,
  getDefaultQuotaValue
}
