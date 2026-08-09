const { EVENTS, trackEvent } = require('./analytics')

const PHOTO_PRODUCT = 'old_photo_story'

const PHOTO_EVENTS = {
  PHOTO_UPLOAD: 'photo_upload',
  MEMORY_FORM_START: 'memory_form_start',
  MEMORY_FORM_SUBMIT: 'memory_form_submit',
  STORY_SUCCESS: 'story_generate_success',
  STORY_VIEW: 'story_view',
  SHARE_CARD: 'share_card_generate',
  FEEDBACK: 'feedback_submit'
}

function trackPhotoEvent(event, metadata) {
  return trackEvent(event, metadata, PHOTO_PRODUCT)
}

module.exports = {
  PHOTO_PRODUCT,
  PHOTO_EVENTS,
  trackPhotoEvent
}
