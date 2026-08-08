const { createReport } = require('../../services/report')
const { checkQuota } = require('../../services/quota')
const { listChildren } = require('../../services/child')
const { trackEvent, EVENTS } = require('../../services/analytics')
const { formatAgeText } = require('../../utils/childHelper')
const { showCloudError } = require('../../utils/showError')
const { CLOUD_FUNCTIONS } = require('../../services/cloud')
const RECORD_TAGS = require('../../constants/recordTags')
const { TEST_MODE, TEST_EVENTS } = require('../../constants/testConfig')

const MIN_TEXT_LENGTH = 5

Page({
  data: {
    childId: '',
    childName: '',
    childAgeText: '',
    eventDate: '',
    eventText: '',
    eventTag: '',
    parentNote: '',
    loading: false,
    generating: false,
    canCreate: true,
    activeTag: '',
    quickTags: RECORD_TAGS,
    loadingStep: 0,
    isFirstRecord: false,
    testMode: TEST_MODE,
    testEvents: TEST_EVENTS
  },

  onLoad(options) {
    const app = getApp()
    const childId = options.childId || app.globalData.selectedChildId || ''
    const childName = options.name
      ? decodeURIComponent(options.name)
      : app.globalData.selectedChildName || ''
    const isFirstRecord = options.firstRecord === '1'

    this.setData({
      childId,
      childName,
      eventDate: new Date().toISOString().slice(0, 10),
      isFirstRecord
    })

    wx.setNavigationBarTitle({ title: '今天，有什么值得记住？' })

    if (app.globalData.selectedChildBirthday || app.globalData.selectedChildAge) {
      this.setData({
        childAgeText: formatAgeText(
          app.globalData.selectedChildBirthday,
          app.globalData.selectedChildAge
        )
      })
    } else if (childId) {
      listChildren().then((data) => {
        const child = (data.list || []).find((c) => c._id === childId)
        if (child) {
          this.setData({ childAgeText: formatAgeText(child.birthday, child.age) })
        }
      })
    }

    this.checkQuotaStatus()
    trackEvent(EVENTS.RECORD_START, { childId, firstRecord: isFirstRecord })
  },

  checkQuotaStatus() {
    checkQuota()
      .then((data) => {
        this.setData({ canCreate: data ? data.canCreate !== false : true })
      })
      .catch(() => {})
  },

  onEventTextInput(e) {
    this.setData({ eventText: e.detail.value })
  },

  onParentNoteInput(e) {
    this.setData({ parentNote: e.detail.value })
  },

  onTagTap(e) {
    const { label, id } = e.currentTarget.dataset
    const { activeTag } = this.data
    this.setData({
      activeTag: activeTag === id ? '' : id,
      eventTag: activeTag === id ? '' : label
    })
  },

  onTestEventTap(e) {
    const { index } = e.currentTarget.dataset
    const item = TEST_EVENTS[index]
    if (!item) return
    this.setData({
      eventText: item.eventText,
      eventTag: item.eventTag,
      activeTag: ''
    })
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

  onSubmit() {
    const { childId, eventDate, eventText, eventTag, parentNote, loading, canCreate } = this.data

    if (loading) return

    if (!canCreate) {
      wx.showModal({
        title: '体验额度已用完',
        content: '你仍可查看已有成长记录。完整版开放后可继续整理新的成长瞬间。',
        showCancel: false
      })
      return
    }

    if (!childId) {
      wx.showToast({ title: '请先选择孩子', icon: 'none' })
      return
    }

    const text = eventText.trim()
    if (!text) {
      wx.showToast({ title: '请写下今天发生的成长小事', icon: 'none' })
      return
    }
    if (text.length < MIN_TEXT_LENGTH) {
      wx.showToast({ title: '请再多写几句（至少' + MIN_TEXT_LENGTH + '个字）', icon: 'none' })
      return
    }

    this.setData({ loading: true, generating: true })
    this.startLoadingAnimation()

    trackEvent(EVENTS.RECORD_SUBMIT, { childId, eventTag })

    createReport(
      'child_growth',
      {
        childId,
        eventText: text,
        eventTag,
        eventDate,
        parentNote: parentNote.trim()
      },
      childId
    )
      .then((data) => {
        this.stopLoadingAnimation()
        this.setData({ loading: false, generating: false })
        wx.redirectTo({
          url: '/pages/report/report?id=' + data.reportId + '&new=1'
        })
      })
      .catch((err) => {
        this.stopLoadingAnimation()
        this.setData({ loading: false, generating: false })
        if (err.code === 'FREE_QUOTA_EXCEEDED') {
          this.setData({ canCreate: false })
          wx.showModal({
            title: '体验额度已用完',
            content: '仍可查看已有成长记录，暂无法整理新的成长瞬间。',
            showCancel: false
          })
          return
        }
        if (err.code === 'INPUT_TOO_SHORT') {
          wx.showToast({ title: err.message, icon: 'none', duration: 3000 })
          return
        }
        showCloudError(err, CLOUD_FUNCTIONS.CREATE_REPORT)
      })
  },

  onUnload() {
    this.stopLoadingAnimation()
  }
})
