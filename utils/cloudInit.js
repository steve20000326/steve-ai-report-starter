const { APPID, ENV_ID } = require('../constants/cloud')

let cloudInstance = null
let initPromise = null

/**
 * 初始化云开发（使用 Cloud 实例绑定 AppID，避免 appid missing）
 */
function initCloud() {
  if (initPromise) return initPromise

  initPromise = new Promise(function (resolve, reject) {
    if (!wx.cloud) {
      reject(new Error('请使用 2.2.3 或以上基础库'))
      return
    }

    if (wx.cloud.Cloud) {
      cloudInstance = new wx.cloud.Cloud({
        resourceAppid: APPID,
        resourceEnv: ENV_ID
      })
      cloudInstance
        .init()
        .then(function () {
          resolve(cloudInstance)
        })
        .catch(function (err) {
          initPromise = null
          reject(err)
        })
      return
    }

    wx.cloud.init({
      env: ENV_ID,
      traceUser: true
    })
    cloudInstance = wx.cloud
    resolve(cloudInstance)
  })

  return initPromise
}

function getCloud() {
  return initCloud()
}

module.exports = {
  initCloud,
  getCloud
}
