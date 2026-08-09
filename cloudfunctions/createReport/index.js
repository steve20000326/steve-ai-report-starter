const cloud = require('wx-server-sdk')
const { callDeepSeek } = require('./lib/deepseek')
const { COLLECTIONS, REPORT_STATUS } = require('./lib/reportEngine')
const { parseReportJson } = require('./lib/jsonParser')
const { getReportTemplate, buildPromptMessages } = require('./lib/promptService')
const { checkUserQuota, consumeUserQuota, getOrInitUser } = require('./lib/userQuota')
const { MAX_RETRY_COUNT } = require('./lib/quotaConfig')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const MIN_CHILD_TEXT = 5
const MIN_PHOTO_MEMORY = 10

function resolveProduct(reportType) {
  if (reportType === 'old_photo_story') return 'memory'
  if (reportType === 'college_choice') return 'college'
  return 'growth'
}

function mapErrorMessage(err, reportType) {
  const msg = String((err && err.message) || err || '')
  if (msg.indexOf('无法解析') !== -1 || msg.indexOf('JSON') !== -1) {
    return {
      code: 'AI_JSON_ERROR',
      message: reportType === 'old_photo_story' ? '故事格式异常，请稍后重试' : 'AI 返回格式异常，请稍后重试'
    }
  }
  if (msg.indexOf('timeout') !== -1 || msg.indexOf('timed out') !== -1) {
    return { code: 'AI_TIMEOUT', message: '整理超时，请检查网络后重试' }
  }
  if (msg.indexOf('network') !== -1 || msg.indexOf('ECONN') !== -1) {
    return { code: 'NETWORK_ERROR', message: '网络连接失败，请检查网络后重试' }
  }
  return { code: err.code || 'CREATE_REPORT_FAILED', message: msg || '生成失败' }
}

async function getChildInfo(openid, childId) {
  if (!childId) return null
  const result = await db.collection(COLLECTIONS.CHILDREN).doc(childId).get()
  const child = result.data
  if (!child || child.userId !== openid) {
    throw new Error('孩子信息不存在或无权访问')
  }
  return child
}

function resolveChildAge(child) {
  if (child.birthday) {
    const birth = new Date(child.birthday)
    if (!isNaN(birth.getTime())) {
      const now = new Date()
      let age = now.getFullYear() - birth.getFullYear()
      const monthDiff = now.getMonth() - birth.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age -= 1
      if (age >= 0) return String(age)
    }
  }
  if (child.age !== undefined && child.age !== null && child.age !== '') {
    return String(child.age)
  }
  return ''
}

function buildChildGrowthInput(raw, child) {
  const eventText = String(raw.eventText || raw.description || '').trim()
  const eventTag = raw.eventTag ? String(raw.eventTag).trim() : ''
  const eventDate = raw.eventDate ? String(raw.eventDate).trim() : new Date().toISOString().slice(0, 10)
  const parentNote = raw.parentNote ? String(raw.parentNote).trim() : ''

  let description = eventText
  if (eventTag) description = '【' + eventTag + '】' + description
  if (parentNote) description += '\n\n家长补充：' + parentNote

  return {
    childId: raw.childId || '',
    eventText,
    eventTag,
    eventDate,
    parentNote,
    name: child ? child.name : raw.name || '',
    age: child ? resolveChildAge(child) : raw.age || '',
    gender: child ? child.gender || '未知' : raw.gender || '未知',
    description
  }
}

function buildPhotoStoryInput(raw) {
  return {
    photoFileId: String(raw.photoFileId || '').trim(),
    photoWidth: raw.photoWidth || 0,
    photoHeight: raw.photoHeight || 0,
    approxYear: String(raw.approxYear || '记不清').trim(),
    people: String(raw.people || '').trim(),
    location: String(raw.location || '').trim(),
    photographer: String(raw.photographer || '').trim(),
    memory: String(raw.memory || '').trim(),
    extraDetail: String(raw.extraDetail || '').trim(),
    storyStyle: raw.storyStyle || 'warm'
  }
}

function buildSuccessUpdateData(reportType, content) {
  const base = {
    title: content.title,
    summary: content.summary || content.shareExcerpt || '',
    keywords: content.keywords || [],
    sections: content.sections || [],
    suggestions: content.suggestions || [],
    content,
    status: REPORT_STATUS.SUCCESS,
    updatedAt: Date.now()
  }

  if (reportType === 'old_photo_story') {
    return Object.assign(base, {
      subtitle: content.subtitle || '',
      opening: content.opening || '',
      story: content.story || '',
      memoryDetails: content.memoryDetails || [],
      closing: content.closing || '',
      shareExcerpt: content.shareExcerpt || '',
      factNote: content.factNote || ''
    })
  }

  return Object.assign(base, {
    factSummary: content.factSummary || '',
    growthObservation: content.growthObservation || '',
    parentResponse: content.parentResponse || '',
    nextSuggestion: content.nextSuggestion || '',
    warmSentence: content.warmSentence || '',
    confidenceNote: content.confidenceNote || ''
  })
}

async function loadRetryReport(openid, retryReportId) {
  const result = await db.collection(COLLECTIONS.REPORTS).doc(retryReportId).get()
  const report = result.data
  if (!report || report.openid !== openid) throw new Error('报告不存在或无权访问')
  if (report.status !== REPORT_STATUS.FAILED && report.status !== 'failed') {
    throw new Error('仅失败的记录可重新生成')
  }
  const retryCount = report.retryCount || 0
  if (retryCount >= MAX_RETRY_COUNT) throw new Error('重试次数已达上限，请稍后再试')
  return report
}

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!openid) return { success: false, message: '用户未登录' }

  const { type, input, childId, retryReportId } = event || {}
  let reportDocId = retryReportId || ''
  let isRetry = !!retryReportId
  let reportType = type

  try {
    let existingRetry = null
    if (isRetry) {
      existingRetry = await loadRetryReport(openid, retryReportId)
      reportType = existingRetry.type
    }

    const quotaInfo = await checkUserQuota(db, openid, reportType)
    if (!quotaInfo.canCreate) {
      return {
        success: false,
        code: 'FREE_QUOTA_EXCEEDED',
        message:
          reportType === 'old_photo_story'
            ? '免费额度已用完，仍可查看已有故事'
            : '免费额度已用完，仍可查看已有成长记录',
        data: { quota: quotaInfo }
      }
    }

    await getOrInitUser(db, openid)

    let resolvedChildId = childId || (input && input.childId) || ''
    let promptInput = {}
    let storedInput = {}
    let eventDateValue = ''

    if (isRetry) {
      storedInput = existingRetry.input || {}
      promptInput = Object.assign({}, storedInput)
      eventDateValue = existingRetry.eventDate || storedInput.eventDate || storedInput.approxYear || ''
      resolvedChildId = existingRetry.childId || ''
      reportDocId = existingRetry._id

      await db.collection(COLLECTIONS.REPORTS).doc(reportDocId).update({
        data: { status: REPORT_STATUS.GENERATING, updatedAt: Date.now() }
      })
    } else {
      if (!reportType) return { success: false, message: '缺少参数 type' }
      if (!input || typeof input !== 'object') return { success: false, message: '缺少参数 input' }

      if (reportType === 'old_photo_story') {
        storedInput = buildPhotoStoryInput(input)
        if (!storedInput.photoFileId) {
          return { success: false, code: 'PHOTO_REQUIRED', message: '请先上传老照片' }
        }
        if (!storedInput.memory) {
          return { success: false, code: 'INPUT_EMPTY', message: '请写下看到这张照片最先想起的事' }
        }
        if (storedInput.memory.length < MIN_PHOTO_MEMORY) {
          return {
            success: false,
            code: 'INPUT_TOO_SHORT',
            message: '请再多写几句记忆（至少' + MIN_PHOTO_MEMORY + '个字）'
          }
        }
        promptInput = storedInput
        eventDateValue = storedInput.approxYear || ''
      } else if (reportType === 'child_growth') {
        resolvedChildId = resolvedChildId || input.childId || ''
        const eventText = String(input.eventText || input.description || '').trim()
        if (!eventText) {
          return { success: false, code: 'INPUT_EMPTY', message: '请写下今天发生的成长小事' }
        }
        if (eventText.length < MIN_CHILD_TEXT) {
          return {
            success: false,
            code: 'INPUT_TOO_SHORT',
            message: '请再多写几句（至少' + MIN_CHILD_TEXT + '个字），帮助我们理解这次瞬间'
          }
        }
        if (!resolvedChildId) return { success: false, message: '请选择孩子' }
        const child = await getChildInfo(openid, resolvedChildId)
        storedInput = buildChildGrowthInput(Object.assign({}, input, { childId: resolvedChildId }), child)
        promptInput = storedInput
        eventDateValue = storedInput.eventDate
        if (!promptInput.name) return { success: false, message: '请填写姓名或选择孩子' }
      } else {
        return { success: false, message: '暂不支持的报告类型: ' + reportType }
      }

      const now = Date.now()
      const createResult = await db.collection(COLLECTIONS.REPORTS).add({
        data: {
          openid,
          type: reportType,
          product: resolveProduct(reportType),
          childId: resolvedChildId || '',
          input: storedInput,
          eventDate: eventDateValue,
          status: REPORT_STATUS.GENERATING,
          retryCount: 0,
          createdAt: now,
          updatedAt: now
        }
      })
      reportDocId = createResult._id
    }

    const template = await getReportTemplate(db, reportType)
    const messages = buildPromptMessages(template, promptInput, reportType)
    const aiText = await callDeepSeek({ messages })
    const content = parseReportJson(aiText, reportType)

    await db
      .collection(COLLECTIONS.REPORTS)
      .doc(reportDocId)
      .update({ data: buildSuccessUpdateData(reportType, content) })

    const quotaAfter = await consumeUserQuota(db, openid, reportType)

    return {
      success: true,
      message: reportType === 'old_photo_story' ? '故事生成成功' : '报告生成成功',
      data: { reportId: reportDocId, quota: quotaAfter }
    }
  } catch (err) {
    console.error('createReport error:', err)

    if (reportDocId) {
      try {
        const updateData = { status: REPORT_STATUS.FAILED, updatedAt: Date.now() }
        if (isRetry) {
          const current = await db.collection(COLLECTIONS.REPORTS).doc(reportDocId).get()
          updateData.retryCount = ((current.data && current.data.retryCount) || 0) + 1
        }
        await db.collection(COLLECTIONS.REPORTS).doc(reportDocId).update({ data: updateData })
      } catch (updateErr) {
        console.warn('mark failed skipped:', updateErr.message)
      }
    }

    const mapped = mapErrorMessage(err, reportType)
    return { success: false, code: mapped.code, message: mapped.message }
  }
}
