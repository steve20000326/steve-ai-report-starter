const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const { reportId } = event

  // Day1 占位：返回 mock 分享卡片数据
  return {
    success: true,
    message: 'generateShareCard placeholder',
    data: {
      reportId: reportId || 'mock-report-id',
      shareImageUrl: '',
      shareTitle: 'Mock Share Card'
    }
  }
}
