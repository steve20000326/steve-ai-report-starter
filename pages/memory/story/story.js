const { getReport, retryReport } = require('../../../services/report')
const { submitFeedback } = require('../../../services/feedback')
const { trackPhotoEvent, PHOTO_EVENTS } = require('../../../services/photoAnalytics')
const { adaptPhotoStory } = require('../../../utils/photoAdapter')
const { getPhotoTempUrl } = require('../../../utils/photoUpload')
const { generateStoryCardImage, saveStoryCardToAlbum } = require('../../../share/memoryCard')
const { formatDate } = require('../../../utils/util')
const { normalizeStatus, isSuccess, REPORT_STATUS } = require('../../../constants/reportStatus')
const { showCloudError } = require('../../../utils/showError')
const { CLOUD_FUNCTIONS } = require('../../../services/cloud')

const POLL_INTERVAL = 3000

Page({
  data: {
    reportId: '',
    loading: true,
    isGenerating: false,
    isFailed: false,
    isSuccess: false,
    canRetry: false,
    retrying: false,
    loadingStep: 0,
    view: {},
    photoUrl: '',
    dateText: '',
    feedbackRating: '',
    feedbackComment: '',
    feedbackSubmitted: false,
    feedbackSubmitting: false,
    showCardResult: false,
    cardImagePath: '',
    cardGenerating: false,
    input: null
  },

  onLoad(options) {
    const reportId = options.id || ''
    if (!reportId) {
      this.setData({ loading: false })
      return
    }
    this.setData({ reportId })
    trackPhotoEvent(PHOTO_EVENTS.STORY_VIEW, { reportId })
    this.loadStory(reportId)
  },

  onUnload() {
    this.stopPolling()
    this.stopLoadingAnimation()
  },

  stopPolling() {
    if (this._pollTimer) {
      clearInterval(this._pollTimer)
      this._pollTimer = null
    }
  },

  startPolling() {
    this.stopPolling()
    this._pollTimer = setInterval(() => {
      if (this.data.isGenerating) this.loadStory(this.data.reportId, true)
    }, POLL_INTERVAL)
  },

  startLoadingAnimation() {
    this.setData({ loadingStep: 0 })
    this._stepTimer = setInterval(() => {
      if (this.data.loadingStep < 2) this.setData({ loadingStep: this.data.loadingStep + 1 })
    }, 4000)
  },

  stopLoadingAnimation() {
    if (this._stepTimer) {
      clearInterval(this._stepTimer)
      this._stepTimer = null
    }
  },

  applyData(data) {
    const status = normalizeStatus(data.status)
    const isGenerating = status === REPORT_STATUS.GENERATING
    const isFailed = status === REPORT_STATUS.FAILED
    const isSuccessStatus = isSuccess(status)
    const view = adaptPhotoStory(data)

    this.setData({
      loading: false,
      isGenerating,
      isFailed,
      isSuccess: isSuccessStatus,
      canRetry: isFailed && (data.retryCount || 0) < 3,
      view,
      input: data.input,
      dateText: formatDate(data.createdAt)
    })

    if (view.photoFileId) {
      getPhotoTempUrl(view.photoFileId).then((url) => {
        if (url) this.setData({ photoUrl: url })
      })
    }

    if (isSuccessStatus) {
      wx.setNavigationBarTitle({ title: view.title })
      this.stopPolling()
      this.stopLoadingAnimation()
      trackPhotoEvent(PHOTO_EVENTS.STORY_SUCCESS, { reportId: data.reportId || this.data.reportId })
    } else if (isGenerating) {
      wx.setNavigationBarTitle({ title: '整理中…' })
      this.startPolling()
      this.startLoadingAnimation()
    }
  },

  loadStory(reportId, silent) {
    if (!silent) this.setData({ loading: true })

    getReport(reportId)
      .then((data) => this.applyData(data))
      .catch((err) => {
        this.stopPolling()
        this.setData({ loading: false })
        if (!silent) showCloudError(err, CLOUD_FUNCTIONS.GET_REPORT)
      })
  },

  onRetry() {
    const { reportId, retrying } = this.data
    if (retrying || !reportId) return
    this.setData({ retrying: true, isGenerating: true, isFailed: false })
    this.startLoadingAnimation()
    retryReport(reportId)
      .then(() => {
        this.setData({ retrying: false })
        this.loadStory(reportId)
      })
      .catch((err) => {
        this.stopLoadingAnimation()
        this.setData({ retrying: false, isFailed: true })
        showCloudError(err, CLOUD_FUNCTIONS.CREATE_REPORT)
      })
  },

  onSaveStory() {
    wx.showToast({ title: '故事已保存', icon: 'success' })
  },

  onGenerateCard() {
    const { view, cardGenerating } = this.data
    if (cardGenerating) return
    this.setData({ cardGenerating: true })

    generateStoryCardImage('storyShareCanvas', {
      title: view.title,
      approxYear: view.approxYear,
      shareExcerpt: view.shareExcerpt
    }, view.photoFileId)
      .then((path) => {
        this.setData({ cardImagePath: path, showCardResult: true, cardGenerating: false })
        trackPhotoEvent(PHOTO_EVENTS.SHARE_CARD, { reportId: this.data.reportId })
      })
      .catch((err) => {
        this.setData({ cardGenerating: false })
        wx.showToast({ title: err.message || '生成失败', icon: 'none' })
      })
  },

  onSaveCard() {
    saveStoryCardToAlbum(this.data.cardImagePath).then(() => {
      wx.showToast({ title: '已保存到相册', icon: 'success' })
    })
  },

  onCloseCard() {
    this.setData({ showCardResult: false })
  },

  onFeedbackSelect(e) {
    this.setData({ feedbackRating: e.currentTarget.dataset.rating })
  },

  onFeedbackComment(e) {
    this.setData({ feedbackComment: e.detail.value })
  },

  onSubmitFeedback() {
    const { reportId, feedbackRating, feedbackComment, feedbackSubmitted, feedbackSubmitting } = this.data
    if (feedbackSubmitted || feedbackSubmitting || !feedbackRating) {
      if (!feedbackRating) wx.showToast({ title: '请选择', icon: 'none' })
      return
    }
    this.setData({ feedbackSubmitting: true })
    submitFeedback(reportId, feedbackRating, feedbackComment)
      .then(() => {
        this.setData({ feedbackSubmitted: true, feedbackSubmitting: false })
        trackPhotoEvent(PHOTO_EVENTS.FEEDBACK, { reportId, rating: feedbackRating })
        wx.showToast({ title: '感谢反馈', icon: 'success' })
      })
      .catch((err) => {
        this.setData({ feedbackSubmitting: false })
        wx.showToast({ title: err.message || '提交失败', icon: 'none' })
      })
  }
})
