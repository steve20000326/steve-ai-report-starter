const { createReport } = require('../../../services/report')
const { checkQuota } = require('../../../services/quota')
const { trackPhotoEvent, PHOTO_EVENTS } = require('../../../services/photoAnalytics')
const { getPhotoTempUrl } = require('../../../utils/photoUpload')
const { showCloudError } = require('../../../utils/showError')
const { CLOUD_FUNCTIONS } = require('../../../services/cloud')
const STORY_STYLES = require('../../../constants/storyStyles')

const MIN_MEMORY = 10
const YEAR_OPTIONS = ['精确年份', '大约年份', '年代', '记不清']

Page({
  data: {
    photoFileId: '',
    photoUrl: '',
    photoWidth: 0,
    photoHeight: 0,
    approxYear: '',
    yearMode: '精确年份',
    yearOptions: YEAR_OPTIONS,
    people: '',
    memory: '',
    location: '',
    photographer: '',
    extraDetail: '',
    storyStyle: 'warm',
    storyStyles: STORY_STYLES,
    showExtra: false,
    loading: false,
    generating: false,
    loadingStep: 0,
    canCreate: true
  },

  onLoad(options) {
    const photoFileId = decodeURIComponent(options.photoFileId || '')
    this.setData({
      photoFileId,
      photoWidth: Number(options.w) || 0,
      photoHeight: Number(options.h) || 0
    })

    wx.setNavigationBarTitle({ title: '这张照片，你还记得什么？' })

    if (photoFileId) {
      getPhotoTempUrl(photoFileId).then((url) => {
        if (url) this.setData({ photoUrl: url })
      })
    }

    checkQuota('old_photo_story').then((data) => {
      this.setData({ canCreate: data ? data.canCreate !== false : true })
    })

    trackPhotoEvent(PHOTO_EVENTS.MEMORY_FORM_START, {})
  },

  onPeopleInput(e) {
    this.setData({ people: e.detail.value })
  },

  onMemoryInput(e) {
    this.setData({ memory: e.detail.value })
  },

  onYearInput(e) {
    this.setData({ approxYear: e.detail.value })
  },

  onYearModeChange(e) {
    this.setData({ yearMode: YEAR_OPTIONS[e.detail.value] })
  },

  onLocationInput(e) {
    this.setData({ location: e.detail.value })
  },

  onPhotographerInput(e) {
    this.setData({ photographer: e.detail.value })
  },

  onExtraInput(e) {
    this.setData({ extraDetail: e.detail.value })
  },

  onToggleExtra() {
    this.setData({ showExtra: !this.data.showExtra })
  },

  onStyleTap(e) {
    this.setData({ storyStyle: e.currentTarget.dataset.id })
  },

  startLoadingAnimation() {
    this.setData({ loadingStep: 0 })
    this._stepTimer = setInterval(() => {
      if (this.data.loadingStep < 2) {
        this.setData({ loadingStep: this.data.loadingStep + 1 })
      }
    }, 4000)
  },

  stopLoadingAnimation() {
    if (this._stepTimer) {
      clearInterval(this._stepTimer)
      this._stepTimer = null
    }
  },

  buildApproxYear() {
    const { approxYear, yearMode } = this.data
    if (!approxYear.trim()) return yearMode === '记不清' ? '记不清' : ''
    if (yearMode === '精确年份') return approxYear.trim()
    return yearMode + '：' + approxYear.trim()
  },

  onSubmit() {
    const { photoFileId, memory, loading, canCreate, storyStyle, people, location, photographer, extraDetail, photoWidth, photoHeight } = this.data

    if (loading) return

    if (!canCreate) {
      wx.showModal({
        title: '体验额度已用完',
        content: '仍可查看已有故事，暂无法整理新的记忆。',
        showCancel: false
      })
      return
    }

    if (!photoFileId) {
      wx.showToast({ title: '请先上传照片', icon: 'none' })
      return
    }

    const mem = memory.trim()
    if (!mem) {
      wx.showToast({ title: '请写下最先想起的事', icon: 'none' })
      return
    }
    if (mem.length < MIN_MEMORY) {
      wx.showToast({ title: '请再多写几句（至少' + MIN_MEMORY + '字）', icon: 'none' })
      return
    }

    this.setData({ loading: true, generating: true })
    this.startLoadingAnimation()

    const input = {
      photoFileId,
      photoWidth,
      photoHeight,
      approxYear: this.buildApproxYear() || '记不清',
      people: people.trim(),
      memory: mem,
      location: location.trim(),
      photographer: photographer.trim(),
      extraDetail: extraDetail.trim(),
      storyStyle
    }

    trackPhotoEvent(PHOTO_EVENTS.MEMORY_FORM_SUBMIT, { storyStyle })

    createReport('old_photo_story', input)
      .then((data) => {
        this.stopLoadingAnimation()
        this.setData({ loading: false, generating: false })
        wx.redirectTo({ url: '/pages/memory/story/story?id=' + data.reportId + '&new=1' })
      })
      .catch((err) => {
        this.stopLoadingAnimation()
        this.setData({ loading: false, generating: false })
        if (err.code === 'FREE_QUOTA_EXCEEDED') {
          this.setData({ canCreate: false })
          wx.showModal({ title: '体验额度已用完', content: err.message, showCancel: false })
          return
        }
        showCloudError(err, CLOUD_FUNCTIONS.CREATE_REPORT)
      })
  },

  onUnload() {
    this.stopLoadingAnimation()
  }
})
