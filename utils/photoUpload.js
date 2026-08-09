/**
 * 云存储照片上传（通过 getCloud 实例，与云函数调用保持一致）
 */

const { getCloud } = require('./cloudInit')

const MAX_SIZE = 10 * 1024 * 1024

function uploadPhoto(tempFilePath) {
  const ext = (tempFilePath.match(/\.(\w+)$/) || [, 'jpg'])[1].toLowerCase()
  const allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif']
  if (allowed.indexOf(ext) === -1) {
    return Promise.reject(new Error('仅支持 JPG、PNG、WEBP 格式'))
  }

  const cloudPath =
    'old-photos/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.' + ext

  return getCloud()
    .then(function (cloud) {
      return cloud.uploadFile({
        cloudPath,
        filePath: tempFilePath
      })
    })
    .then(function (res) {
      return {
        fileID: res.fileID,
        cloudPath
      }
    })
    .catch(function (err) {
      const msg = (err && (err.errMsg || err.message)) || '照片上传失败'
      if (msg.indexOf('wx.cloud.init') !== -1 || msg.indexOf("Cloud API isn't enabled") !== -1) {
        return Promise.reject(new Error('云开发未就绪，请重启小程序后重试'))
      }
      return Promise.reject(new Error(msg))
    })
}

function chooseAndUploadPhoto() {
  return new Promise(function (resolve, reject) {
    getCloud()
      .then(function () {
        wx.chooseMedia({
          count: 1,
          mediaType: ['image'],
          sourceType: ['album'],
          sizeType: ['compressed'],
          success: function (res) {
            const file = res.tempFiles[0]
            if (!file) {
              reject(new Error('未选择照片'))
              return
            }
            if (file.size > MAX_SIZE) {
              reject(new Error('照片过大，请选择 10MB 以内的图片'))
              return
            }
            uploadPhoto(file.tempFilePath)
              .then(function (data) {
                resolve({
                  photoFileId: data.fileID,
                  photoWidth: file.width || 0,
                  photoHeight: file.height || 0,
                  tempPath: file.tempFilePath
                })
              })
              .catch(reject)
          },
          fail: function (err) {
            if (err.errMsg && err.errMsg.indexOf('cancel') !== -1) {
              reject(new Error('已取消选择'))
            } else {
              reject(new Error(err.errMsg || '选择照片失败'))
            }
          }
        })
      })
      .catch(reject)
  })
}

function getPhotoTempUrl(fileID) {
  if (!fileID) return Promise.resolve('')
  return getCloud()
    .then(function (cloud) {
      return cloud.getTempFileURL({ fileList: [fileID] })
    })
    .then(function (res) {
      const item = res.fileList && res.fileList[0]
      return (item && item.tempFileURL) || ''
    })
    .catch(function () {
      return ''
    })
}

module.exports = {
  chooseAndUploadPhoto,
  uploadPhoto,
  getPhotoTempUrl,
  MAX_SIZE
}
