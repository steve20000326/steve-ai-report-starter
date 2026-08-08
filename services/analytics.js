const { callCloud, CLOUD_FUNCTIONS } = require('./cloud')

const EVENTS = {
  APP_OPEN: 'app_open',
  CHILD_CREATE: 'child_create',
  RECORD_START: 'record_start',
  RECORD_SUBMIT: 'record_submit',
  REPORT_SUCCESS: 'report_success',
  REPORT_VIEW: 'report_view',
  SHARE_CARD_GENERATE: 'share_card_generate',
  FEEDBACK_SUBMIT: 'feedback_submit'
}

function trackEvent(event, metadata) {
  if (!event) return Promise.resolve()

  return callCloud(CLOUD_FUNCTIONS.TRACK_EVENT, {
    event,
    productType: 'child_growth',
    metadata: metadata || {}
  }).catch(function (err) {
    console.warn('trackEvent skipped:', err.message)
  })
}

module.exports = {
  EVENTS,
  trackEvent
}
