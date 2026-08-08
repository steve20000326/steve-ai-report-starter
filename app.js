const { initCloud } = require('./utils/cloudInit')
const { trackEvent, EVENTS } = require('./services/analytics')

App({
  onLaunch() {
    initCloud().catch(function (err) {
      console.error('云开发初始化失败:', err)
    })
    trackEvent(EVENTS.APP_OPEN, {})
  },

  globalData: {
    userInfo: null,
    selectedProductType: 'child_growth',
    selectedChildId: '',
    selectedChildName: '',
    selectedChildBirthday: '',
    selectedChildAge: ''
  }
})
