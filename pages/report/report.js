const { getReport, retryReport } = require('../../services/report')
const { submitFeedback } = require('../../services/feedback')
const { trackEvent, EVENTS } = require('../../services/analytics')
const { formatDate } = require('../../utils/util')
const { adaptChildGrowthReport } = require('../../utils/reportAdapter')
const { formatNameForShare } = require('../../utils/privacyName')
const { generateShareCardImage, saveImageToAlbum } = require('../../utils/shareCard')
const {
  normalizeStatus,
  isSuccess,
  REPORT_STATUS
} = require('../../constants/reportStatus')
const { MAX_RETRY_COUNT } = require('../../constants/quota')
const { showCloudError } = require('../../utils/showError')
const { CLOUD_FUNCTIONS } = require('../../services/cloud')

const POLL_INTERVAL = 3000
const PRIVACY_OPTIONS = [
  { id: 'mask', label: '姓/名脱敏' },
  { id: 'full', label: '显示姓名' },
  { id: 'hide', label: '不显示姓名' }
]

Page({
  data: {
    reportId: '',
    loading: true,
    error: '',
    status: '',
    isGenerating: false,
    isFailed: false,
    isSuccess: false,
    retryCount: 0,
    canRetry: false,
    retrying: false,
    input: null,
    loadingStep: 0,
    showPrivacyModal: false,
    showCardResult: false,
    privacyMode: 'mask',
    privacyOptions: PRIVACY_OPTIONS,
    cardImagePath: '',
    cardGenerating: false,
    view: {},
    dateText: '',
    feedbackRating: '',
    feedbackComment: '',
    feedbackSubmitted: false,
    feedbackSubmitting: false,
    _trackedSuccess: false
  },

  onLoad(options) {
    const reportId = options.id || ''
    if (!reportId) {
      this.setData({ loading: false, error: '缺少报告 ID' })
      return
    }
    this.setData({ reportId })
    trackEvent(EVENTS.REPORT_VIEW, { reportId })
    this.loadReport(reportId)
  },

  onUnload() {
    this.stopPolling()
    this.stopLoadingAnimation()
  },

  onHide() {
    this.stopPolling()
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
      if (this.data.isGenerating && this.data.reportId) {
        this.loadReport(this.data.reportId, true)
      } else {
        this.stopPolling()
      }
    }, POLL_INTERVAL)
  },

  startLoadingAnimation() {
    this.setData({ loadingStep: 0 })
    this._stepTimer = setInterval(() => {
      const step = this.data.loadingStep
      if (step < 2) {
        this.setData({ loadingStep: step + 1 })
      }
    }, 4000)
  },

  stopLoadingAnimation() {
    if (this._stepTimer) {
      clearInterval(this._stepTimer)
      this._stepTimer = null
    }
  },

  applyReportData(data) {
    const status = normalizeStatus(data.status)
    const isGenerating = status === REPORT_STATUS.GENERATING
    const isFailed = status === REPORT_STATUS.FAILED
    const isSuccessStatus = isSuccess(status)
    const retryCount = data.retryCount || 0
    const view = adaptChildGrowthReport(data)
    const dateText = view.eventDate
      ? formatDate(new Date(view.eventDate).getTime())
      : formatDate(data.createdAt)

    this.setData({
      loading: false,
      error: '',
      status,
      isGenerating,
      isFailed,
      isSuccess: isSuccessStatus,
      retryCount,
      canRetry: isFailed && retryCount < MAX_RETRY_COUNT,
      input: data.input || null,
      view,
      dateText
    })

    if (isSuccessStatus) {
      wx.setNavigationBarTitle({ title: view.pageTitle })
      this.stopPolling()
      this.stopLoadingAnimation()
      if (!this.data._trackedSuccess) {
        this.setData({ _trackedSuccess: true })
        trackEvent(EVENTS.REPORT_SUCCESS, { reportId: data.reportId || this.data.reportId })
      }
    } else if (isGenerating) {
      wx.setNavigationBarTitle({ title: '整理中…' })
      this.startPolling()
      this.startLoadingAnimation()
    } else if (isFailed) {
      wx.setNavigationBarTitle({ title: '整理未完成' })
      this.stopPolling()
      this.stopLoadingAnimation()
    }
  },

  loadReport(reportId, silent) {
    if (!silent) {
      this.setData({ loading: true, error: '' })
    }

    getReport(reportId)
      .then((data) => {
        this.applyReportData(data)
      })
      .catch((err) => {
        this.stopPolling()
        this.stopLoadingAnimation()
        this.setData({
          loading: false,
          error: err.message || '加载失败'
        })
        if (!silent) {
          showCloudError(err, CLOUD_FUNCTIONS.GET_REPORT)
        }
      })
  },

  onRetry() {
    const { reportId, retrying, canRetry } = this.data
    if (retrying || !canRetry || !reportId) return

    this.setData({ retrying: true, isGenerating: true, isFailed: false })
    this.startLoadingAnimation()

    retryReport(reportId)
      .then(() => {
        this.setData({ retrying: false })
        this.loadReport(reportId)
      })
      .catch((err) => {
        this.stopLoadingAnimation()
        this.setData({ retrying: false, isGenerating: false, isFailed: true })
        if (err.code === 'FREE_QUOTA_EXCEEDED') {
          wx.showModal({
            title: '体验额度已用完',
            content: '暂无法重新整理，完整版开放后可继续使用。',
            showCancel: false
          })
          return
        }
        showCloudError(err, CLOUD_FUNCTIONS.CREATE_REPORT)
      })
  },

  onSaveArchive() {
    wx.showToast({ title: '已保存到成长档案', icon: 'success' })
  },

  onShowCardPreview() {
    this.setData({ showPrivacyModal: true })
  },

  onPrivacySelect(e) {
    const { mode } = e.currentTarget.dataset
    this.setData({ privacyMode: mode })
  },

  onClosePrivacyModal() {
    this.setData({ showPrivacyModal: false })
  },

  onConfirmGenerateCard() {
    const { view, privacyMode, dateText, cardGenerating } = this.data
    if (cardGenerating) return

    this.setData({ cardGenerating: true, showPrivacyModal: false })

    const displayName = formatNameForShare(view.childName, privacyMode)
    const cardData = {
      title: view.emotionTitle,
      dateText,
      factSummary: view.factSummary,
      keywords: view.keywords,
      warmSentence: view.warmSentence,
      displayName
    }

    generateShareCardImage('shareCanvas', cardData)
      .then((filePath) => {
        this.setData({
          cardImagePath: filePath,
          showCardResult: true,
          cardGenerating: false
        })
        trackEvent(EVENTS.SHARE_CARD_GENERATE, {
          reportId: this.data.reportId,
          privacyMode
        })
      })
      .catch((err) => {
        this.setData({ cardGenerating: false })
        wx.showToast({ title: err.message || '生成失败', icon: 'none' })
      })
  },

  onSaveCardImage() {
    const { cardImagePath } = this.data
    if (!cardImagePath) return

    saveImageToAlbum(cardImagePath)
      .then(() => {
        wx.showToast({ title: '已保存到相册', icon: 'success' })
      })
      .catch((err) => {
        if (err.message && err.message.indexOf('权限') !== -1) {
          wx.showModal({
            title: '需要相册权限',
            content: err.message,
            confirmText: '去设置',
            success: (res) => {
              if (res.confirm) wx.openSetting()
            }
          })
        } else {
          wx.showToast({ title: err.message || '保存失败', icon: 'none' })
        }
      })
  },

  onCloseCardResult() {
    this.setData({ showCardResult: false })
  },

  onFeedbackSelect(e) {
    const { rating } = e.currentTarget.dataset
    this.setData({ feedbackRating: rating })
  },

  onFeedbackCommentInput(e) {
    this.setData({ feedbackComment: e.detail.value })
  },

  onSubmitFeedback() {
    const { reportId, feedbackRating, feedbackComment, feedbackSubmitted, feedbackSubmitting } =
      this.data

    if (feedbackSubmitted || feedbackSubmitting) return
    if (!feedbackRating) {
      wx.showToast({ title: '请选择评价', icon: 'none' })
      return
    }

    this.setData({ feedbackSubmitting: true })

    submitFeedback(reportId, feedbackRating, feedbackComment)
      .then(() => {
        this.setData({ feedbackSubmitted: true, feedbackSubmitting: false })
        trackEvent(EVENTS.FEEDBACK_SUBMIT, { reportId, rating: feedbackRating })
        wx.showToast({ title: '感谢你的反馈', icon: 'success' })
      })
      .catch((err) => {
        this.setData({ feedbackSubmitting: false })
        wx.showToast({ title: err.message || '提交失败', icon: 'none' })
      })
  }
})
