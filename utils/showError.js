/**
 * 解析并展示云调用错误
 */

function extractCloudCallDetail(msg) {
  if (!msg) return ''
  const errMsgMatch = msg.match(/errMsg:\s*(.+?)(?:\s*\||$)/i)
  if (errMsgMatch) return errMsgMatch[1].trim()
  const failMatch = msg.match(/cloud\.callFunction:fail\s+(.+)/i)
  return failMatch ? failMatch[1].trim() : ''
}

function parseCloudError(err, functionName) {
  const raw = (err && (err.message || err.errMsg)) || String(err || '未知错误')
  const detail = extractCloudCallDetail(raw)

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

  if (raw.indexOf('未部署') !== -1) {
    return {
      title: '云函数未部署',
      content: raw
    }
  }

  if (raw.indexOf('调用失败') !== -1) {
    return {
      title: '云函数调用失败',
      content:
        raw +
        '\n\n请在微信开发者工具：\n1. 运行 bash cloudfunctions/sync-common.sh\n2. 右键 cloudfunctions/createReport → 上传并部署：云端安装依赖\n3. 云开发控制台确认环境为 cloud1-d5gy8cytj61fdbfdd'
    }
  }

  if (raw.indexOf('cloud.callFunction:fail') !== -1) {
    return {
      title: '云函数调用失败',
      content:
        '云函数「' +
        (functionName || '') +
        '」调用失败' +
        (detail ? '：' + detail : '') +
        '。\n\n请确认已部署该云函数，且云开发环境正常。'
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
