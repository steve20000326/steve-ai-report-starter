const { checkQuota } = require('../../services/quota')
const { listChildren } = require('../../services/child')
const { listReports } = require('../../services/report')
const { daysBetween } = require('../../utils/util')
const { showCloudError } = require('../../utils/showError')
const { CLOUD_FUNCTIONS } = require('../../services/cloud')

const MENU_ITEMS = [
  { id: 'children', title: '孩子档案', url: '/pages/index/index', tab: true },
  { id: 'album', title: '成长纪念册', action: 'coming' },
  { id: 'reports', title: '我的报告', url: '/pages/history/history', tab: true },
  { id: 'quota', title: '体验额度', action: 'quota' },
  { id: 'privacy', title: '隐私与数据', action: 'coming' },
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
      listReports({ type: 'child_growth', pageSize: 50 }).catch((err) => {
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
        content: '当前剩余 ' + remaining + ' / ' + total + ' 次免费整理机会。\n\n完整版开放后可无限记录成长瞬间。',
        showCancel: false
      })
      return
    }

    if (action === 'about') {
      wx.showModal({
        title: '关于产品',
        content: 'AI儿童成长档案\n记录成长小事，看见孩子一点点长大。',
        showCancel: false
      })
      return
    }

    if (action === 'coming') {
      wx.showToast({ title: '即将开放', icon: 'none' })
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
