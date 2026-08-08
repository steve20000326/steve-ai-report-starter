const { createChild } = require('../../services/child')
const { trackEvent, EVENTS } = require('../../services/analytics')
const { showCloudError } = require('../../utils/showError')
const { CLOUD_FUNCTIONS } = require('../../services/cloud')

Page({
  data: {
    name: '',
    birthday: '',
    age: '',
    gender: '',
    genderOptions: ['男', '女'],
    genderIndex: -1,
    loading: false
  },

  onNameInput(e) {
    this.setData({ name: e.detail.value })
  },

  onBirthdayChange(e) {
    this.setData({ birthday: e.detail.value })
  },

  onAgeInput(e) {
    this.setData({ age: e.detail.value })
  },

  onGenderChange(e) {
    const index = Number(e.detail.value)
    this.setData({
      genderIndex: index,
      gender: this.data.genderOptions[index]
    })
  },

  onSubmit() {
    const { name, birthday, age, gender, loading } = this.data

    if (loading) return

    if (!name.trim()) {
      wx.showToast({ title: '请填写孩子姓名', icon: 'none' })
      return
    }

    if (!birthday && !String(age).trim()) {
      wx.showToast({ title: '请填写生日或年龄', icon: 'none' })
      return
    }

    this.setData({ loading: true })
    wx.showLoading({ title: '保存中...', mask: true })

    createChild({
      name: name.trim(),
      birthday,
      age: String(age).trim(),
      gender: gender || ''
    })
      .then((data) => {
        wx.hideLoading()
        this.setData({ loading: false })

        trackEvent(EVENTS.CHILD_CREATE, { childId: data.childId })

        const app = getApp()
        app.globalData.selectedChildId = data.childId
        app.globalData.selectedChildName = name.trim()
        app.globalData.selectedChildBirthday = birthday
        app.globalData.selectedChildAge = age

        wx.showModal({
          title: '档案已建立',
          content: '要不要现在记录第一件成长小事？',
          confirmText: '记录第一件成长小事',
          cancelText: '稍后再说',
          success: (res) => {
            if (res.confirm) {
              wx.redirectTo({
                url:
                  '/pages/create/create?childId=' +
                  data.childId +
                  '&firstRecord=1&name=' +
                  encodeURIComponent(name.trim())
              })
            } else {
              wx.navigateBack()
            }
          }
        })
      })
      .catch((err) => {
        wx.hideLoading()
        this.setData({ loading: false })
        showCloudError(err, CLOUD_FUNCTIONS.CREATE_CHILD)
      })
  }
})
