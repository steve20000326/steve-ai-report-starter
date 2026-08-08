/**
 * Canvas 成长分享卡生成
 */

const CARD_W = 750
const CARD_H = 1100

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  if (!text) return y
  const chars = text.split('')
  let line = ''
  let lines = 0
  let currentY = y

  for (let i = 0; i < chars.length; i++) {
    const test = line + chars[i]
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, currentY)
      line = chars[i]
      currentY += lineHeight
      lines += 1
      if (maxLines && lines >= maxLines) {
        ctx.fillText(line.slice(0, -1) + '…', x, currentY)
        return currentY + lineHeight
      }
    } else {
      line = test
    }
  }
  if (line) {
    ctx.fillText(line, x, currentY)
    currentY += lineHeight
  }
  return currentY
}

function drawRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

/**
 * @param {object} canvas - type=2d canvas node
 * @param {object} data
 */
function drawShareCard(canvas, data) {
  const ctx = canvas.getContext('2d')
  const dpr = wx.getSystemInfoSync().pixelRatio || 2
  canvas.width = CARD_W * dpr
  canvas.height = CARD_H * dpr
  ctx.scale(dpr, dpr)

  // 背景
  ctx.fillStyle = '#F7F7F3'
  ctx.fillRect(0, 0, CARD_W, CARD_H)

  // 内卡片
  drawRoundRect(ctx, 40, 60, CARD_W - 80, CARD_H - 120, 24)
  ctx.fillStyle = '#FFFFFF'
  ctx.fill()

  let y = 120

  // 产品名
  ctx.fillStyle = '#65A87C'
  ctx.font = '24px sans-serif'
  ctx.fillText('AI儿童成长档案', 80, y)
  y += 36

  ctx.fillStyle = '#7C857F'
  ctx.font = '22px sans-serif'
  if (data.displayName && data.displayName !== '孩子') {
    ctx.fillText(data.displayName + ' 的成长瞬间', 80, y)
  } else {
    ctx.fillText('孩子成长瞬间', 80, y)
  }
  y += 48

  // 日期
  ctx.fillStyle = '#7C857F'
  ctx.font = '22px sans-serif'
  ctx.fillText(data.dateText || '', 80, y)
  y += 40

  // 标题
  ctx.fillStyle = '#26352C'
  ctx.font = 'bold 34px sans-serif'
  y = wrapText(ctx, data.title || '', 80, y, CARD_W - 160, 44, 2)
  y += 20

  // 事实简述
  ctx.fillStyle = '#26352C'
  ctx.font = '26px sans-serif'
  y = wrapText(ctx, data.factSummary || '', 80, y, CARD_W - 160, 38, 4)
  y += 24

  // 关键词
  if (data.keywords && data.keywords.length) {
    let kx = 80
    data.keywords.slice(0, 3).forEach(function (kw) {
      const text = String(kw)
      ctx.font = '22px sans-serif'
      const tw = ctx.measureText(text).width + 32
      drawRoundRect(ctx, kx, y, tw, 40, 20)
      ctx.fillStyle = '#EDF5EF'
      ctx.fill()
      ctx.fillStyle = '#65A87C'
      ctx.fillText(text, kx + 16, y + 28)
      kx += tw + 12
    })
    y += 60
  }

  // 温暖纪念语
  drawRoundRect(ctx, 80, y, CARD_W - 160, 100, 16)
  ctx.fillStyle = '#EDF5EF'
  ctx.fill()
  ctx.fillStyle = '#65A87C'
  ctx.font = '26px sans-serif'
  wrapText(ctx, data.warmSentence || '', 100, y + 40, CARD_W - 200, 36, 2)

  // 底部
  ctx.fillStyle = '#C5D5CA'
  ctx.font = '20px sans-serif'
  ctx.fillText('记录成长小事，看见孩子一点点长大', 80, CARD_H - 80)

  return ctx
}

function generateShareCardImage(canvasId, data) {
  return new Promise(function (resolve, reject) {
    const query = wx.createSelectorQuery()
    query
      .select('#' + canvasId)
      .fields({ node: true, size: true })
      .exec(function (res) {
        if (!res || !res[0] || !res[0].node) {
          reject(new Error('Canvas 初始化失败'))
          return
        }
        const canvas = res[0].node
        drawShareCard(canvas, data)

        setTimeout(function () {
          wx.canvasToTempFilePath({
            canvas,
            width: CARD_W,
            height: CARD_H,
            destWidth: CARD_W * 2,
            destHeight: CARD_H * 2,
            fileType: 'png',
            quality: 1,
            success: function (r) {
              resolve(r.tempFilePath)
            },
            fail: function (err) {
              reject(new Error(err.errMsg || '生成图片失败'))
            }
          })
        }, 300)
      })
  })
}

function saveImageToAlbum(filePath) {
  return new Promise(function (resolve, reject) {
    wx.saveImageToPhotosAlbum({
      filePath,
      success: resolve,
      fail: function (err) {
        if (err.errMsg && err.errMsg.indexOf('auth deny') !== -1) {
          reject(new Error('需要相册权限才能保存，请在设置中开启'))
        } else {
          reject(new Error(err.errMsg || '保存失败'))
        }
      }
    })
  })
}

module.exports = {
  CARD_W,
  CARD_H,
  generateShareCardImage,
  saveImageToAlbum
}
