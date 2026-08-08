const { callCloud, CLOUD_FUNCTIONS } = require('./cloud')

function createChild(data) {
  return callCloud(CLOUD_FUNCTIONS.CREATE_CHILD, data)
}

function listChildren() {
  return callCloud(CLOUD_FUNCTIONS.LIST_CHILDREN)
}

module.exports = {
  createChild,
  listChildren
}
