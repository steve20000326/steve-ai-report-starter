const { callCloud, CLOUD_FUNCTIONS } = require('./cloud')

function checkQuota() {
  return callCloud(CLOUD_FUNCTIONS.CHECK_QUOTA)
}

module.exports = {
  checkQuota
}
