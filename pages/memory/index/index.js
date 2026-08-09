const { chooseAndUploadPhoto } = require('../../../utils/photoUpload')
const { trackPhotoEvent, PHOTO_EVENTS } = require('../../../services/photoAnalytics')

Page({
  data: {},

  onChoosePhoto() {
    wx.showLoading({ title: '准备中…', mask: true })
    chooseAndUploadPhoto()
      .then((photo) => {
        wx.hideLoading()
        trackPhotoEvent(PHOTO_EVENTS.PHOTO_UPLOAD, { photoFileId: photo.photoFileId })
        const q =
          'photoFileId=' +
          encodeURIComponent(photo.photoFileId) +
          '&w=' +
          photo.photoWidth +
          '&h=' +
          photo.photoHeight
        wx.navigateTo({ url: '/pages/memory/create/create?' + q })
      })
      .catch((err) => {
        wx.hideLoading()
        if (err.message !== '已取消选择') {
          wx.showToast({ title: err.message || '上传失败', icon: 'none', duration: 3000 })
        }
      })
  },

  onViewHistory() {
    wx.navigateTo({ url: '/pages/memory/history/history' })
  }
})
