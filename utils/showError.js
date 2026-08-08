/**
 * 解析并展示云调用错误
 */

function parseCloudError(err, functionName) {
  const raw = (err && (err.message || err.errMsg)) || String(err || '未知错误')

  if (raw.indexOf('appid missing') !== -1) {
    return {
      title: '云开发未就绪',
      content:
        '请在微信开发者工具「详情→基本信息」确认 AppID 为 wx7924b29d3d305dbf，并已开通云开发。'
    }
  }

  if (
    raw.indexOf('FUNCTION_NOT_FOUND') !== -1 ||
    raw.indexOf('-501000') !== -1
  ) {
    return {
      title: '云函数未部署',
      content:
        '云函数「' +
        (functionName || '') +
        '」未部署。\n\n请在开发者工具 cloudfunctions 目录右键「上传并部署：云端安装依赖」。'
    }
  }

  if (raw.indexOf('Cannot find module') !== -1) {
    return {
      title: '云函数需更新',
      content:
        '云函数「' +
        (functionName || '') +
        '」代码不完整。\n\n请先运行 bash cloudfunctions/sync-common.sh，再重新部署该云函数。'
    }
  }

  if (
    raw.indexOf('collection') !== -1 ||
    raw.indexOf('集合') !== -1 ||
    raw.indexOf('Db or Table not exist') !== -1
  ) {
    return {
      title: '数据库未就绪',
      content:
        '请在云开发控制台 → 数据库，创建集合：\nusers、children、reports、report_templates、usage_events、feedback'
    }
  }

  if (raw.indexOf('cloud.callFunction:fail') !== -1) {
    return {
      title: '云函数调用失败',
      content:
        '云函数「' +
        (functionName || '') +
        '」调用失败。\n\n请确认已部署该云函数，且云开发环境正常。'
    }
  }

  return {
    title: '请求失败',
    content: raw.length > 200 ? raw.slice(0, 200) + '...' : raw
  }
}

function showCloudError(err, functionName) {
  const { title, content } = parseCloudError(err, functionName)
  wx.showModal({ title, content, showCancel: false })
}

module.exports = {
  parseCloudError,
  showCloudError
}
