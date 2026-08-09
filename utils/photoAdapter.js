/**
 * old_photo_story 展示适配
 */

function adaptPhotoStory(report) {
  const content = report.content || {}
  const input = report.input || {}

  return {
    photoFileId: input.photoFileId || '',
    approxYear: input.approxYear || report.eventDate || '',
    people: input.people || '',
    subtitle: content.subtitle || report.subtitle || '',
    title: content.title || report.title || '老照片故事',
    opening: content.opening || report.opening || '',
    story: content.story || report.story || content.summary || report.summary || '',
    memoryDetails: content.memoryDetails || report.memoryDetails || [],
    closing: content.closing || report.closing || '',
    shareExcerpt: content.shareExcerpt || report.shareExcerpt || '',
    factNote: content.factNote || report.factNote || '',
    storyStyle: input.storyStyle || 'warm'
  }
}

module.exports = {
  adaptPhotoStory
}
