const { listReports } = require('../../services/report')
const { formatDateShort } = require('../../utils/util')
const { groupReportsByMonth, parseEventDateTs } = require('../../utils/reportAdapter')
const { normalizeStatus, getTimelineItem, isSuccess } = require('../../constants/reportStatus')
const { showCloudError } = require('../../utils/showError')
const { CLOUD_FUNCTIONS } = require('../../services/cloud')

Page({
  data: {
    monthGroups: [],
    loading: true,
    hasData: false
  },

  onShow() {
    this.loadReports()
  },

  loadReports() {
    this.setData({ loading: true })

    listReports({ type: 'child_growth', pageSize: 50 })
      .then((data) => {
        const reports = (data.list || []).map((item) => {
          const status = normalizeStatus(item.status)
          const display = getTimelineItem(status)
          const keywords = item.keywords || []
          const sortTs = parseEventDateTs(item)
          return {
            ...item,
            status,
            sortTs,
            dateText: formatDateShort(sortTs),
            displayTitle: isSuccess(status)
              ? item.title || '成长瞬间'
              : display.title || '成长瞬间',
            keywords: keywords.slice(0, 3),
            isSuccess: isSuccess(status),
            isFailed: status === 'failed',
            isGenerating: status === 'generating'
          }
        })

        const monthGroups = groupReportsByMonth(reports)
        this.setData({
          monthGroups,
          hasData: reports.length > 0,
          loading: false
        })
      })
      .catch((err) => {
        this.setData({ monthGroups: [], hasData: false, loading: false })
        showCloudError(err, CLOUD_FUNCTIONS.LIST_REPORTS)
      })
  },

  onReportTap(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({ url: '/pages/report/report?id=' + id })
  },

  onCreateFirst() {
    wx.switchTab({ url: '/pages/index/index' })
  }
})
