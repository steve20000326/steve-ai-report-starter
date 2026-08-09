Page({
  data: {
    name: 'AI高考志愿规划助手',
    features: ['高考成绩分析', '专业方向推荐', '志愿建议报告']
  },

  onBackHome() {
    wx.switchTab({ url: '/pages/home/home' })
  }
})
