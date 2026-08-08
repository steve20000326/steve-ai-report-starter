const { getCloud } = require('../utils/cloudInit')

const CLOUD_FUNCTIONS = {
  CREATE_REPORT: 'createReport',
  GET_REPORT: 'getReport',
  LIST_REPORTS: 'listReports',
  GENERATE_SHARE_CARD: 'generateShareCard',
  CHECK_QUOTA: 'checkQuota',
  CREATE_CHILD: 'createChild',
  LIST_CHILDREN: 'listChildren',
  TRACK_EVENT: 'trackEvent',
  SUBMIT_FEEDBACK: 'submitFeedback'
}

function normalizeCloudError(err, name) {
  const msg = (err && (err.message || err.errMsg)) || String(err || '')

  if (msg.indexOf('FUNCTION_NOT_FOUND') !== -1 || msg.indexOf('-501000') !== -1) {
    return new Error('云函数「' + name + '」未部署，请在开发者工具右键上传并部署')
  }

  if (msg.indexOf('Cannot find module') !== -1) {
    return new Error('云函数「' + name + '」需重新部署（缺少依赖文件）')
  }

  if (msg.indexOf('cloud.callFunction:fail') !== -1) {
    return new Error('云函数「' + name + '」调用失败，请检查是否已部署')
  }

  if (msg.indexOf('免费额度已用完') !== -1) {
    const e = new Error('免费额度已用完，暂无法生成新的 AI 报告')
    e.code = 'FREE_QUOTA_EXCEEDED'
    return e
  }

  if (msg.indexOf('INPUT_TOO_SHORT') !== -1 || msg.indexOf('至少') !== -1) {
    const e = new Error('请再多写几句，帮助我们理解这次成长瞬间')
    e.code = 'INPUT_TOO_SHORT'
    return e
  }

  if (msg.indexOf('timed out') !== -1 || msg.indexOf('timeout') !== -1 || msg.indexOf('超时') !== -1) {
    return new Error('AI 整理超时了，请检查网络后重试')
  }

  if (msg.indexOf('无法解析') !== -1 || msg.indexOf('JSON') !== -1) {
    return new Error('AI 返回格式异常，请稍后重试')
  }

  if (msg.indexOf('network') !== -1 || msg.indexOf('网络') !== -1) {
    return new Error('网络连接失败，请检查网络后重试')
  }

  return err instanceof Error ? err : new Error(msg || '请求失败')
}

function callCloud(name, data = {}) {
  if (!name) {
    return Promise.reject(new Error('云函数名称不能为空'))
  }

  return getCloud()
    .then(function (cloud) {
      return cloud.callFunction({ name, data })
    })
    .then(function (res) {
      const result = res.result || {}
      if (!result.success) {
        const e = new Error(result.message || '请求失败')
        if (result.code) e.code = result.code
        return Promise.reject(e)
      }
      return result.data
    })
    .catch(function (err) {
      return Promise.reject(normalizeCloudError(err, name))
    })
}

module.exports = {
  CLOUD_FUNCTIONS,
  callCloud
}
