/**
 * old_photo_story 分享故事卡 Canvas
 */

const { getCloud } = require('./cloudInit')

const CARD_W = 750
const CARD_H = 1000

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
      lines++
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

function drawStoryCard(canvas, data, photoImage) {
  const ctx = canvas.getContext('2d')
  const dpr = wx.getSystemInfoSync().pixelRatio || 2
  canvas.width = CARD_W * dpr
  canvas.height = CARD_H * dpr
  ctx.scale(dpr, dpr)

  ctx.fillStyle = '#F4F0E8'
  ctx.fillRect(0, 0, CARD_W, CARD_H)

  drawRoundRect(ctx, 40, 50, CARD_W - 80, CARD_H - 100, 24)
  ctx.fillStyle = '#FFFCF6'
  ctx.fill()

  let y = 90

  ctx.fillStyle = '#9A7553'
  ctx.font = '22px sans-serif'
  ctx.fillText('AI老照片故事', 80, y)
  y += 36

  if (photoImage) {
    const imgW = CARD_W - 160
    const imgH = 280
    drawRoundRect(ctx, 80, y, imgW, imgH, 12)
    ctx.save()
    ctx.clip()
    ctx.drawImage(photoImage, 80, y, imgW, imgH)
    ctx.restore()
    y += imgH + 24
  }

  ctx.fillStyle = '#8B857D'
  ctx.font = '22px sans-serif'
  ctx.fillText(data.approxYear || '', 80, y)
  y += 36

  ctx.fillStyle = '#332E28'
  ctx.font = 'bold 32px sans-serif'
  y = wrapText(ctx, data.title || '', 80, y, CARD_W - 160, 40, 2)
  y += 16

  ctx.fillStyle = '#332E28'
  ctx.font = '26px sans-serif'
  wrapText(ctx, data.shareExcerpt || '', 80, y, CARD_W - 160, 36, 4)

  ctx.fillStyle = '#C5B8A8'
  ctx.font = '20px sans-serif'
  ctx.fillText('有些故事，藏在一张老照片里', 80, CARD_H - 70)
}

function generateStoryCardImage(canvasId, data, photoFileId) {
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

        function renderWithPhoto(photoImage) {
          drawStoryCard(canvas, data, photoImage)
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
          }, 400)
        }

        if (!photoFileId) {
          renderWithPhoto(null)
          return
        }

        getCloud()
          .then(function (cloud) {
            return cloud.getTempFileURL({ fileList: [photoFileId] })
          })
          .then(function (urlRes) {
            const url = urlRes.fileList && urlRes.fileList[0] && urlRes.fileList[0].tempFileURL
            if (!url) {
              renderWithPhoto(null)
              return
            }
            const image = canvas.createImage()
            image.onload = function () {
              renderWithPhoto(image)
            }
            image.onerror = function () {
              renderWithPhoto(null)
            }
            image.src = url
          })
          .catch(function () {
            renderWithPhoto(null)
          })
      })
  })
}

const { saveImageToAlbum } = require('./shareCard')

module.exports = {
  generateStoryCardImage,
  saveStoryCardToAlbum: saveImageToAlbum
}
