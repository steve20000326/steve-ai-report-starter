const { callCloud, CLOUD_FUNCTIONS } = require('./cloud')

function checkQuota(productType) {
  return callCloud(CLOUD_FUNCTIONS.CHECK_QUOTA, { productType: productType || 'child_growth' })
}

module.exports = {
  checkQuota
}
