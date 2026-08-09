Page({
  onLoad(options) {
    const q = options ? Object.keys(options).map(function (k) {
      return k + '=' + encodeURIComponent(options[k])
    }).join('&') : ''
    wx.redirectTo({ url: '/pages/memory/story/story' + (q ? '?' + q : '') })
  }
})
