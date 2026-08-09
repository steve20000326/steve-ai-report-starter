const { initCloud } = require('./utils/cloudInit')
const { trackEvent, EVENTS } = require('./services/analytics')

App({
  onLaunch() {
    initCloud()
      .then(function () {
        trackEvent(EVENTS.APP_OPEN, {})
      })
      .catch(function (err) {
        console.error('云开发初始化失败:', err)
      })
  },

  globalData: {
    userInfo: null,
    selectedProductType: 'child_growth',
    selectedProduct: 'growth',
    selectedChildId: '',
    selectedChildName: '',
    selectedChildBirthday: '',
    selectedChildAge: ''
  }
})
