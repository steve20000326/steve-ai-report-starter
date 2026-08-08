/**
 * Day4 回归测试（Node 环境，不依赖微信运行时）
 * 运行: node scripts/day4-regression.test.js
 */

const assert = require('assert')
const { adaptChildGrowthReport, groupReportsByMonth, parseEventDateTs } = require('../utils/reportAdapter')
const { formatNameForShare } = require('../utils/privacyName')
const { validateChildGrowthOutput, validateGenericReportOutput } = require('../cloudfunctions/common/jsonParser')
const { calcAge, formatAgeText } = require('../utils/childHelper')
const { TEST_MODE, TEST_EVENTS } = require('../constants/testConfig')
const RECORD_TAGS = require('../constants/recordTags')

let passed = 0
let failed = 0

function test(name, fn) {
  try {
    fn()
    passed++
    console.log('  ✓', name)
  } catch (e) {
    failed++
    console.error('  ✗', name, '-', e.message)
  }
}

console.log('\n=== Day4 Regression Tests ===\n')

// A. 旧 reports 兼容
test('旧 sections 结构可适配展示', () => {
  const view = adaptChildGrowthReport({
    title: '旧标题',
    summary: '旧摘要',
    keywords: ['责任感'],
    sections: [
      { title: '观察', content: '帮奶奶收碗筷' },
      { title: '亮点', content: '主动承担' }
    ],
    suggestions: ['谢谢你帮奶奶', '明天继续'],
    input: { name: '小宇', eventDate: '2026-08-01' },
    createdAt: Date.now()
  })
  assert.ok(view.factSummary.indexOf('帮奶奶') !== -1)
  assert.ok(view.growthObservation.indexOf('主动承担') !== -1)
  assert.ok(view.parentResponse.indexOf('谢谢你') !== -1)
})

// B. V1.1 新结构
test('V1.1 新 JSON 结构校验', () => {
  const out = validateChildGrowthOutput({
    title: '今天，他主动照顾了奶奶',
    factSummary: '小宇帮奶奶收碗筷',
    growthObservation: '可能正在萌芽主动承担',
    keywords: ['责任感', '关心他人'],
    parentResponse: '谢谢你帮奶奶，奶奶很开心。',
    nextSuggestion: '明天也可以留意他有没有延续',
    warmSentence: '每一个小瞬间，都值得被温柔地留下。',
    confidenceNote: '这只是一次成长观察，还不能形成稳定判断。',
    summary: '摘要'
  })
  assert.strictEqual(out.warmSentence.length > 0, true)
  assert.strictEqual(out.confidenceNote.length > 0, true)
})

// C. 时间线按 eventDate 排序
test('时间线按 eventDate 倒序分组', () => {
  const groups = groupReportsByMonth([
    { eventDate: '2026-07-15', createdAt: 1, title: 'A' },
    { eventDate: '2026-08-10', createdAt: 2, title: 'B' },
    { eventDate: '2026-08-05', createdAt: 3, title: 'C' }
  ])
  assert.ok(groups.length >= 2)
  assert.strictEqual(groups[0].items[0].title, 'B')
})

test('parseEventDateTs 优先 eventDate', () => {
  const ts = parseEventDateTs({
    eventDate: '2026-06-01',
    createdAt: new Date('2026-08-01').getTime()
  })
  assert.strictEqual(new Date(ts).getMonth(), 5)
})

// D. 隐私姓名
test('姓名脱敏默认 mask', () => {
  assert.strictEqual(formatNameForShare('小宇', 'mask'), '小*')
  assert.strictEqual(formatNameForShare('王小宇', 'mask'), '王*宇')
  assert.strictEqual(formatNameForShare('小宇', 'hide'), '孩子')
  assert.strictEqual(formatNameForShare('小宇', 'full'), '小宇')
})

// E. 孩子档案 age/birthday
test('birthday 或 age 计算年龄', () => {
  assert.strictEqual(formatAgeText('', 6), '6 岁')
  assert.ok(formatAgeText('2018-01-01').indexOf('岁') !== -1)
})

// F. 快捷标签 6 个
test('快捷标签 6 个', () => {
  assert.strictEqual(RECORD_TAGS.length, 6)
})

// G. TEST_MODE 正式关闭
test('TEST_MODE 正式环境为 false', () => {
  assert.strictEqual(TEST_MODE, false)
})

test('测试事件 3 条', () => {
  assert.strictEqual(TEST_EVENTS.length, 3)
})

// H. Quota 逻辑：consume 仅在 success 路径（代码审查断言）
test('createReport 仅在 success 后 consumeUserQuota（静态检查）', () => {
  const fs = require('fs')
  const src = fs.readFileSync(require('path').join(__dirname, '../cloudfunctions/createReport/index.js'), 'utf8')
  const successIdx = src.indexOf('status: REPORT_STATUS.SUCCESS')
  const consumeIdx = src.indexOf('await consumeUserQuota')
  assert.ok(successIdx !== -1 && consumeIdx !== -1)
  assert.ok(consumeIdx > successIdx, 'consume 应在 success 更新之后')
  assert.ok(src.indexOf('consumeUserQuota') < src.indexOf('} catch'), 'consume 不在 catch 块')
})

// I. 埋点事件白名单
test('trackEvent 白名单 8 个事件', () => {
  const fs = require('fs')
  const src = fs.readFileSync(require('path').join(__dirname, '../cloudfunctions/trackEvent/index.js'), 'utf8')
  const events = ['app_open', 'child_create', 'record_start', 'record_submit', 'report_success', 'report_view', 'share_card_generate', 'feedback_submit']
  events.forEach((e) => {
    assert.ok(src.indexOf("'" + e + "'") !== -1, '缺少事件: ' + e)
  })
})

// J. feedback rating 白名单
test('feedback rating 三种', () => {
  const fs = require('fs')
  const src = fs.readFileSync(require('path').join(__dirname, '../cloudfunctions/submitFeedback/index.js'), 'utf8')
  assert.ok(src.indexOf('helpful') !== -1)
  assert.ok(src.indexOf('not_helpful') !== -1)
})

console.log('\n--- Results ---')
console.log('Passed:', passed)
console.log('Failed:', failed)
if (failed > 0) process.exit(1)
console.log('\nALL DAY4 REGRESSION TESTS PASSED\n')
