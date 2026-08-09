/**
 * 公共能力入口（AI / 用户 / Quota / Analytics / Error）
 * 业务模块通过 common 调用，不直接耦合彼此
 */

module.exports = {
  cloud: require('../services/cloud'),
  report: require('../services/report'),
  quota: require('../services/quota'),
  child: require('../services/child'),
  analytics: require('../services/analytics'),
  photoAnalytics: require('../services/photoAnalytics'),
  feedback: require('../services/feedback'),
  error: require('../utils/showError'),
  cloudInit: require('../utils/cloudInit'),
  products: require('../constants/products')
}
