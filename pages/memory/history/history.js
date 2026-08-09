const { listReports } = require('../../../services/report')
const { getPhotoTempUrl } = require('../../../utils/photoUpload')
const { formatDateShort } = require('../../../utils/util')
const { showCloudError } = require('../../../utils/showError')
const { CLOUD_FUNCTIONS } = require('../../../services/cloud')

Page({
  data: {
    stories: [],
    loading: true,
    hasData: false
  },

  onShow() {
    this.loadStories()
  },

  loadStories() {
    this.setData({ loading: true })

    listReports({ type: 'old_photo_story', pageSize: 50 })
      .then(async (data) => {
        const list = data.list || []
        const stories = await Promise.all(
          list.map(async (item) => {
            const input = item.input || {}
            let thumbUrl = ''
            if (input.photoFileId) {
              thumbUrl = await getPhotoTempUrl(input.photoFileId)
            }
            return {
              ...item,
              thumbUrl,
              approxYear: input.approxYear || item.eventDate || '',
              displayTitle: item.title || '老照片故事',
              dateText: formatDateShort(item.createdAt)
            }
          })
        )

        this.setData({
          stories,
          hasData: stories.length > 0,
          loading: false
        })
      })
      .catch((err) => {
        this.setData({ stories: [], hasData: false, loading: false })
        showCloudError(err, CLOUD_FUNCTIONS.LIST_REPORTS)
      })
  },

  onStoryTap(e) {
    wx.navigateTo({ url: '/pages/memory/story/story?id=' + e.currentTarget.dataset.id })
  },

  onCreateFirst() {
    wx.navigateTo({ url: '/pages/memory/index/index' })
  }
})
