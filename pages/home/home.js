const { TOOLS } = require('../../constants/tools')

Page({
  data: {
    tools: TOOLS
  },

  onToolTap(e) {
    const { route } = e.currentTarget.dataset
    if (!route) return
    wx.navigateTo({ url: route })
  }
})
