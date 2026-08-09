const { checkQuota } = require('../../services/quota')
const { listChildren } = require('../../services/child')
const { listReports } = require('../../services/report')
const { daysBetween } = require('../../utils/util')
const { showCloudError } = require('../../utils/showError')
const { CLOUD_FUNCTIONS } = require('../../services/cloud')
const { TOOLS, ROUTES } = require('../../constants/tools')

const MENU_ITEMS = [
  { id: 'home', title: '工具大厅', url: ROUTES.home, tab: true },
  { id: 'growth', title: TOOLS[1].name, url: TOOLS[1].route },
  { id: 'memory', title: TOOLS[2].name, url: TOOLS[2].route },
  { id: 'college', title: TOOLS[0].name, url: TOOLS[0].route },
  { id: 'record', title: '全部记录', url: ROUTES.record, tab: true },
  { id: 'quota', title: '体验额度', action: 'quota' },
  { id: 'about', title: '关于产品', action: 'about' }
]

Page({
  data: {
    childCount: 0,
    reportCount: 0,
    companionDays: 1,
    quota: null,
    loading: true,
    menuItems: MENU_ITEMS
  },

  onShow() {
    this.loadData()
  },

  loadData() {
    this.setData({ loading: true })
    let shownError = false

    const showOnce = (err, fnName) => {
      if (shownError) return
      shownError = true
      showCloudError(err, fnName)
    }

    Promise.all([
      checkQuota().catch((err) => {
        showOnce(err, CLOUD_FUNCTIONS.CHECK_QUOTA)
        return null
      }),
      listChildren().catch((err) => {
        showOnce(err, CLOUD_FUNCTIONS.LIST_CHILDREN)
        return { list: [] }
      }),
      listReports({ pageSize: 50 }).catch((err) => {
        showOnce(err, CLOUD_FUNCTIONS.LIST_REPORTS)
        return { list: [], total: 0 }
      })
    ]).then(([quota, children, reports]) => {
      const childList = children.list || []
      const reportList = reports.list || []
      const earliestChild = childList.reduce((min, c) => {
        if (!c.createdAt) return min
        return !min || c.createdAt < min ? c.createdAt : min
      }, null)
      const earliestReport = reportList.reduce((min, r) => {
        if (!r.createdAt) return min
        return !min || r.createdAt < min ? r.createdAt : min
      }, null)
      const startTs = earliestChild || earliestReport

      this.setData({
        quota,
        childCount: childList.length,
        reportCount: reports.total || reportList.length,
        companionDays: startTs ? daysBetween(startTs) : 1,
        loading: false
      })
    })
  },

  onMenuTap(e) {
    const { action, url, tab } = e.currentTarget.dataset

    if (action === 'quota') {
      const q = this.data.quota
      const remaining = q ? q.remainingQuota : '--'
      const total = q ? q.totalQuota : 3
      wx.showModal({
        title: '体验额度',
        content: '当前剩余 ' + remaining + ' / ' + total + ' 次免费体验机会。\n\n完整版开放后可继续使用全部工具。',
        showCancel: false
      })
      return
    }

    if (action === 'about') {
      wx.showModal({
        title: '关于产品',
        content: '稻歌AI实验室\n帮助家庭解决教育成长、高考规划与家庭记忆整理。',
        showCancel: false
      })
      return
    }

    if (url) {
      if (tab) {
        wx.switchTab({ url })
      } else {
        wx.navigateTo({ url })
      }
    }
  }
})
