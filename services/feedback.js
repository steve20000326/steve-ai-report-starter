const { callCloud, CLOUD_FUNCTIONS } = require('./cloud')

function submitFeedback(reportId, rating, comment) {
  return callCloud(CLOUD_FUNCTIONS.SUBMIT_FEEDBACK, {
    reportId,
    rating,
    comment: comment || ''
  })
}

module.exports = {
  submitFeedback
}
