const { listReports } = require('../../services/report')
const { getPhotoTempUrl } = require('../../utils/photoUpload')
const { formatDateShort } = require('../../utils/util')
const { groupReportsByMonth, parseEventDateTs } = require('../../utils/reportAdapter')
const { normalizeStatus, getTimelineItem, isSuccess } = require('../../constants/reportStatus')
const { showCloudError } = require('../../utils/showError')
const { CLOUD_FUNCTIONS } = require('../../services/cloud')
const { ROUTES } = require('../../constants/tools')

Page({
  data: {
    growthGroups: [],
    memoryStories: [],
    loading: true,
    hasGrowth: false,
    hasMemory: false,
    hasData: false
  },

  onShow() {
    this.loadRecords()
  },

  loadRecords() {
    this.setData({ loading: true })
    const self = this

    Promise.all([
      listReports({ type: 'child_growth', pageSize: 50 }),
      listReports({ type: 'old_photo_story', pageSize: 50 })
    ])
      .then(function (results) {
        const growthData = results[0]
        const memoryData = results[1]

        const growthReports = (growthData.list || []).map(function (item) {
          const status = normalizeStatus(item.status)
          const display = getTimelineItem(status)
          const sortTs = parseEventDateTs(item)
          return Object.assign({}, item, {
            status: status,
            sortTs: sortTs,
            dateText: formatDateShort(sortTs),
            displayTitle: isSuccess(status)
              ? item.title || '成长瞬间'
              : display.title || '成长瞬间',
            keywords: (item.keywords || []).slice(0, 3),
            isSuccess: isSuccess(status),
            isFailed: status === 'failed',
            isGenerating: status === 'generating'
          })
        })

        const memoryList = memoryData.list || []
        return Promise.all(
          memoryList.map(function (item) {
            const input = item.input || {}
            if (!input.photoFileId) {
              return Promise.resolve(
                Object.assign({}, item, {
                  thumbUrl: '',
                  approxYear: input.approxYear || item.eventDate || '',
                  displayTitle: item.title || '老照片故事',
                  dateText: formatDateShort(item.createdAt)
                })
              )
            }
            return getPhotoTempUrl(input.photoFileId).then(function (thumbUrl) {
              return Object.assign({}, item, {
                thumbUrl: thumbUrl || '',
                approxYear: input.approxYear || item.eventDate || '',
                displayTitle: item.title || '老照片故事',
                dateText: formatDateShort(item.createdAt)
              })
            })
          })
        ).then(function (memoryStories) {
          const growthGroups = groupReportsByMonth(growthReports)
          const hasGrowth = growthReports.length > 0
          const hasMemory = memoryStories.length > 0

          self.setData({
            growthGroups: growthGroups,
            memoryStories: memoryStories,
            hasGrowth: hasGrowth,
            hasMemory: hasMemory,
            hasData: hasGrowth || hasMemory,
            loading: false
          })
        })
      })
      .catch(function (err) {
        self.setData({
          growthGroups: [],
          memoryStories: [],
          hasGrowth: false,
          hasMemory: false,
          hasData: false,
          loading: false
        })
        showCloudError(err, CLOUD_FUNCTIONS.LIST_REPORTS)
      })
  },

  onGrowthTap(e) {
    wx.navigateTo({ url: ROUTES.growth.report + '?id=' + e.currentTarget.dataset.id })
  },

  onMemoryTap(e) {
    wx.navigateTo({ url: ROUTES.memory.story + '?id=' + e.currentTarget.dataset.id })
  },

  onGoHome() {
    wx.switchTab({ url: ROUTES.home })
  }
})
