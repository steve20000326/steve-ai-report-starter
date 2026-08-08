/**
 * 额度服务
 */

const { COLLECTIONS, DEFAULT_FREE_QUOTA, isCollectionMissingError } = require('./reportEngine')

/**
 * 获取或初始化用户额度
 * @param {object} db
 * @param {string} openid
 */
async function getOrInitQuota(db, openid) {
  const quotas = db.collection(COLLECTIONS.QUOTAS)

  try {
    const existing = await quotas.where({ openid }).limit(1).get()

    if (existing.data.length) {
      return existing.data[0]
    }

    const now = Date.now()
    const data = {
      openid,
      totalQuota: DEFAULT_FREE_QUOTA,
      usedQuota: 0,
      createdAt: now,
      updatedAt: now
    }

    const addResult = await quotas.add({ data })
    return Object.assign({ _id: addResult._id }, data)
  } catch (err) {
    if (isCollectionMissingError(err)) {
      return {
        _id: '',
        openid,
        totalQuota: DEFAULT_FREE_QUOTA,
        usedQuota: 0
      }
    }
    throw err
  }
}

/**
 * 检查是否有剩余额度
 */
async function checkRemainingQuota(db, openid) {
  const quota = await getOrInitQuota(db, openid)
  const remaining = quota.totalQuota - quota.usedQuota
  return {
    totalQuota: quota.totalQuota,
    usedQuota: quota.usedQuota,
    remainingQuota: Math.max(0, remaining),
    canCreate: remaining > 0
  }
}

/**
 * 消耗一次额度
 */
async function consumeQuota(db, openid) {
  const quota = await getOrInitQuota(db, openid)
  const remaining = quota.totalQuota - quota.usedQuota

  if (remaining <= 0) {
    throw new Error('免费额度已用完（共 ' + quota.totalQuota + ' 次）')
  }

  await db.collection(COLLECTIONS.QUOTAS).doc(quota._id).update({
    data: {
      usedQuota: quota.usedQuota + 1,
      updatedAt: Date.now()
    }
  }).catch(function (err) {
    if (isCollectionMissingError(err)) return
    throw err
  })

  return {
    totalQuota: quota.totalQuota,
    usedQuota: quota.usedQuota + 1,
    remainingQuota: remaining - 1
  }
}

module.exports = {
  getOrInitQuota,
  checkRemainingQuota,
  consumeQuota
}
