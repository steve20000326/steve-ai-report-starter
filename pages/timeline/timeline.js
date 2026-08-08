const { listReports } = require('../../services/report')
const { formatTime } = require('../../utils/util')
const { normalizeStatus, isSuccess, getTimelineItem, REPORT_STATUS } = require('../../constants/reportStatus')
const { showCloudError } = require('../../utils/showError')
const { CLOUD_FUNCTIONS } = require('../../services/cloud')

Page({
  data: {
    childId: '',
    childName: '',
    reports: [],
    loading: true,
    error: ''
  },

  onLoad(options) {
    const childId = options.childId || ''
    const childName = decodeURIComponent(options.name || '')
    this.setData({ childId, childName })
    wx.setNavigationBarTitle({
      title: (childName || '孩子') + '的成长时间线'
    })
    if (!childId) {
      this.setData({ loading: false, error: '缺少孩子信息' })
      return
    }
    this.loadTimeline()
  },

  onShow() {
    if (this.data.childId && !this.data.loading) {
      this.loadTimeline()
    }
  },

  loadTimeline() {
    const { childId } = this.data
    if (!childId) return

    this.setData({ loading: true, error: '' })

    listReports({ type: 'child_growth', childId, pageSize: 50 })
      .then((data) => {
        const reports = (data.list || []).map((item) => {
          const status = normalizeStatus(item.status)
          const display = getTimelineItem(status)
          return {
            ...item,
            status,
            timeText: formatTime(item.createdAt),
            displayTitle: display.title || item.title || '成长记录',
            displaySubtitle:
              display.subtitle || item.summary || (item.input && item.input.description) || '',
            statusText: display.statusText,
            isGenerating: status === REPORT_STATUS.GENERATING,
            isFailed: status === REPORT_STATUS.FAILED,
            isSuccess: isSuccess(status)
          }
        })
        this.setData({ reports, loading: false })
      })
      .catch((err) => {
        this.setData({ loading: false, error: err.message || '加载失败' })
        showCloudError(err, CLOUD_FUNCTIONS.LIST_REPORTS)
      })
  },

  onReportTap(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({ url: '/pages/report/report?id=' + id })
  }
})
