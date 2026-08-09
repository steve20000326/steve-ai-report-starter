const { listChildren } = require('../../../services/child')
const { listReports } = require('../../../services/report')
const { checkQuota } = require('../../../services/quota')
const { enrichChildWithReports } = require('../../../utils/childHelper')
const { showCloudError } = require('../../../utils/showError')
const { CLOUD_FUNCTIONS } = require('../../../services/cloud')

const DEFAULT_QUOTA = {
  totalQuota: 3,
  usedQuota: 0,
  remainingQuota: 3,
  canCreate: true
}

Page({
  data: {
    children: [],
    quota: DEFAULT_QUOTA,
    loading: true,
    hasChild: false
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
      listChildren()
        .then((data) => (data && data.list) || [])
        .catch((err) => {
          showOnce(err, CLOUD_FUNCTIONS.LIST_CHILDREN)
          return []
        }),
      listReports({ type: 'child_growth', pageSize: 50 })
        .then((data) => (data && data.list) || [])
        .catch((err) => {
          showOnce(err, CLOUD_FUNCTIONS.LIST_REPORTS)
          return []
        }),
      checkQuota()
        .then((data) => data || DEFAULT_QUOTA)
        .catch(() => DEFAULT_QUOTA)
    ]).then(([children, reports, quota]) => {
      const enriched = children.map((child) => enrichChildWithReports(child, reports))
      this.setData({
        children: enriched,
        hasChild: enriched.length > 0,
        quota,
        loading: false
      })
    })
  },

  onAddChild() {
    wx.navigateTo({ url: '/pages/growth/child-add/child-add' })
  },

  onMainCTA() {
    const { children, quota } = this.data
    if (!children.length) {
      this.onAddChild()
      return
    }
    if (quota && !quota.canCreate) {
      wx.showModal({
        title: '体验额度已用完',
        content: '你仍可查看已有成长记录。完整版开放后可继续整理新的成长瞬间。',
        showCancel: false
      })
      return
    }
    const first = children[0]
    this.goCreate(first._id, first.name)
  },

  onCreateRecord(e) {
    const { id, name } = e.currentTarget.dataset
    const { quota } = this.data

    if (quota && !quota.canCreate) {
      wx.showModal({
        title: '体验额度已用完',
        content: '你仍可查看已有成长记录。完整版开放后可继续整理新的成长瞬间。',
        showCancel: false
      })
      return
    }
    this.goCreate(id, name)
  },

  goCreate(id, name) {
    const app = getApp()
    const child = this.data.children.find((c) => c._id === id)
    app.globalData.selectedChildId = id
    app.globalData.selectedChildName = name
    app.globalData.selectedChildBirthday = child ? child.birthday : ''
    app.globalData.selectedProductType = 'child_growth'
    wx.navigateTo({ url: '/pages/growth/create/create?childId=' + id })
  },

  onViewTimeline(e) {
    const { id, name } = e.currentTarget.dataset
    wx.navigateTo({
      url: '/pages/growth/timeline/timeline?childId=' + id + '&name=' + encodeURIComponent(name)
    })
  }
})
